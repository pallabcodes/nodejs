import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
  dbType?: 'postgres' | 'mysql' | 'mongodb' | 'unknown';
  dbName?: string;
}

export interface ContainerConnectionInfo {
  container: DockerContainer;
  connectionString?: string;  // Make this optional
  username: string;
  defaultDatabase: string;
  // Add these MySQL-specific properties
  host?: string;
  port?: number;
  password?: string;
  protocol?: string;
  user?: string;
}

export class DockerService {
  /**
   * Check if docker is installed and running
   */
  async isDockerAvailable(): Promise<boolean> {
    try {
      await execAsync('docker info');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all running containers
   */
  async getRunningContainers(): Promise<DockerContainer[]> {
    try {
      const { stdout } = await execAsync(
        'docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}"'
      );

      if (!stdout.trim()) {
        return [];
      }

      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [id, name, image, status, ports] = line.split('|');
          const container: DockerContainer = {
            id,
            name,
            image,
            status,
            ports,
            dbType: this.detectDatabaseType(image),
          };

          return container;
        });
    } catch (error) {
      console.error(chalk.red(`Error listing containers: ${(error as Error).message}`));
      return [];
    }
  }

  /**
   * Get database containers (PostgreSQL, MySQL, MongoDB)
   */
  async getDatabaseContainers(): Promise<DockerContainer[]> {
    const containers = await this.getRunningContainers();
    return containers.filter(
      (container) => container.dbType && container.dbType !== 'unknown'
    );
  }

  /**
   * Check if a container is a database container and what type
   */
  private detectDatabaseType(image: string): 'postgres' | 'mysql' | 'mongodb' | 'unknown' {
    const lowerImage = image.toLowerCase();

    if (lowerImage.includes('postgres')) return 'postgres';
    if (lowerImage.includes('mysql')) return 'mysql';
    if (lowerImage.includes('mongodb') || lowerImage.includes('mongo:')) return 'mongodb';

    return 'unknown';
  }

  /**
   * Get environment variables from a container
   */
  async getContainerEnvVars(containerId: string): Promise<Record<string, string>> {
    try {
      const { stdout } = await execAsync(`docker inspect --format='{{json .Config.Env}}' ${containerId}`);
      
      const envArray = JSON.parse(stdout) as string[];
      const envVars: Record<string, string> = {};
      
      envArray.forEach(item => {
        const [key, ...valueParts] = item.split('=');
        const value = valueParts.join('='); // Handle values that might contain '='
        envVars[key] = value;
      });
      
      return envVars;
    } catch (error) {
      console.error(chalk.red(`Error getting environment variables: ${(error as Error).message}`));
      return {};
    }
  }

  /**
   * Get connection information for PostgreSQL container
   */
  async getPostgresConnectionInfo(container: DockerContainer): Promise<ContainerConnectionInfo | null> {
    try {
      const envVars = await this.getContainerEnvVars(container.id);
      
      // Try to find relevant connection info from environment variables
      const username = envVars.POSTGRES_USER || envVars.POSTGRES_USERNAME || 'postgres';
      const password = envVars.POSTGRES_PASSWORD || '';
      const database = envVars.POSTGRES_DB || username || 'postgres';
      const host = container.name;
      
      // For PostgreSQL, we can connect directly using docker exec
      const connectionString = `postgresql://${username}:${password}@${host}/${database}`;
      
      return {
        container,
        connectionString,
        username,
        defaultDatabase: database
      };
    } catch (error) {
      console.error(chalk.red(`Error getting Postgres connection info: ${(error as Error).message}`));
      return null;
    }
  }

  /**
   * Get connection information for MySQL container
   */
  async getMySQLConnectionInfo(container: DockerContainer): Promise<ContainerConnectionInfo | null> {
    try {
      const envVars = await this.getContainerEnvVars(container.id);
      
      // Extract MySQL connection info
      const username = envVars.MYSQL_USER || 'root';
      const password = envVars.MYSQL_ROOT_PASSWORD || envVars.MYSQL_PASSWORD || 'admin#123';
      const database = envVars.MYSQL_DATABASE || username || 'mysql';
      
      // Return the connection info with the updated interface properties
      return {
        container,
        username,
        defaultDatabase: database,
        host: '127.0.0.1',  // Use IP instead of socket
        port: 3306,         // MySQL default port
        user: username,       // Or your MySQL user
        password,  // Your MySQL password
        protocol: 'tcp'     // Force TCP protocol instead of socket
      };
    } catch (error) {
      console.error(chalk.red(`Error getting MySQL connection info: ${(error as Error).message}`));
      return null;
    }
  }

  /**
   * Get connection info for a specific database container
   */
  async getConnectionInfo(container: DockerContainer): Promise<ContainerConnectionInfo | null> {
    switch (container.dbType) {
      case 'postgres':
        return this.getPostgresConnectionInfo(container);
      case 'mysql':
        return this.getMySQLConnectionInfo(container);
      default:
        console.warn(chalk.yellow(`Unsupported database type: ${container.dbType}`));
        return null;
    }
  }

  /**
   * Execute command inside container
   */
  async execInContainer(
    containerId: string, 
    command: string,
    options: any = {}
  ): Promise<{ stdout: string; stderr: string }> {
    try {
      const dockerCommand = `docker exec ${options.user ? `-u ${options.user}` : ''} ${containerId} sh -c "${command.replace(/"/g, '\\"')}"`;
      
      const { stdout, stderr } = await execAsync(dockerCommand);
      
      // Don't treat password warnings as errors
      if (stderr && stderr.includes('Using a password on the command line interface')) {
        return { 
          stdout, 
          stderr: stderr.includes('ERROR') ? stderr : '' 
        };
      }
      
      return { stdout, stderr };
    } catch (error) {
      if (error instanceof Error && 
          error.message.includes('Using a password on the command line interface') &&
          !(error as any).stderr?.includes('ERROR')) {
        return { stdout: (error as any).stdout || '', stderr: '' };
      }
      throw error;
    }
  }

  /**
   * Run a query in a PostgreSQL container
   */
  async runPostgresQuery(
    container: DockerContainer,
    query: string,
    database: string,
    username: string = 'postgres'
  ): Promise<any> {
    // Escape the query for shell execution
    const escapedQuery = query
      .replace(/'/g, "'\\''") // Escape single quotes
      .replace(/"/g, '\\"'); // Escape double quotes
    
    try {
      const { stdout, stderr } = await this.execInContainer(
        container.id,
        `psql -U ${username} -d ${database} -c "${escapedQuery}" -t -A`,
        { user: username }
      );
      
      if (stderr) {
        throw new Error(stderr);
      }
      
      return stdout.trim();
    } catch (error) {
      throw new Error(`Error executing query in container: ${(error as Error).message}`);
    }
  }
  
  /**
   * Run a query in a MySQL container and preserve column names
   */
  async runMySQLQuery(
    container: DockerContainer,
    query: string,
    database: string,
    username: string = 'root',
    password: string = 'admin#123'
  ): Promise<any> {
    try {
      // Use the format option to get column names in the output
      const { stdout, stderr } = await this.execInContainer(
        container.id,
        `mysql -u${username} -p${password} -D${database} -e "${query}" --table`,
        { user: username }
      );
      
      // Handle password warning
      if (stderr && !stderr.includes('ERROR')) {
        console.warn(chalk.yellow('MySQL warning (safe to ignore): Password provided on command line'));
      } else if (stderr) {
        throw new Error(stderr);
      }
      
      return stdout.trim();
    } catch (error) {
      // Handle errors better
      if (error instanceof Error && 
          error.message.includes('Using a password on the command line interface')) {
        // Still return the output if it was just a warning
        return (error as any).stdout || '';
      }
      throw new Error(`Error executing query in container: ${(error as Error).message}`);
    }
  }
  
  /**
   * Run query in container based on database type
   */
  async runQueryInContainer(
    container: DockerContainer,
    query: string,
    database: string,
    username: string,
    password: string = 'admin#123'  // Add default password parameter
  ): Promise<string> {
    switch (container.dbType) {
      case 'postgres':
        return this.runPostgresQuery(container, query, database, username);
      case 'mysql':
        return this.runMySQLQuery(container, query, database, username, password);
      default:
        throw new Error(`Unsupported database type: ${container.dbType}`);
    }
  }
  
  /**
   * Get list of databases in a container
   */
  async listDatabases(container: DockerContainer): Promise<string[]> {
    try {
      let result: string;
      
      if (container.dbType === 'postgres') {
        const { stdout } = await this.execInContainer(
          container.id,
          'psql -U postgres -c "SELECT datname FROM pg_database WHERE datistemplate = false;" -t -A'
        );
        result = stdout;
      } else if (container.dbType === 'mysql') {
        // Pass the password directly but handle warnings
        const { stdout, stderr } = await this.execInContainer(
          container.id,
          'mysql -uroot -padmin#123 -e "SHOW DATABASES;" --silent'
        );
        
        if (stderr && stderr.includes('ERROR')) {
          throw new Error(stderr);
        }
        
        result = stdout;
      } else {
        throw new Error(`Unsupported database type: ${container.dbType}`);
      }
      
      return result
        .trim()
        .split('\n')
        .filter(db => db !== 'information_schema' && db !== 'performance_schema' && db);
    } catch (error) {
      console.error(chalk.red(`Error listing databases: ${(error as Error).message}`));
      return [];
    }
  }

  /**
   * Get Docker networks
   */
  async getDockerNetworks(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        'docker network ls --format "{{.Name}}"'
      );

      return stdout
        .trim()
        .split('\n')
        .filter(Boolean);
    } catch (error) {
      console.error(chalk.red(`Error listing Docker networks: ${(error as Error).message}`));
      return [];
    }
  }

  /**
   * Get containers in a specific network
   */
  async getContainersInNetwork(networkName: string): Promise<DockerContainer[]> {
    try {
      // Get network information in JSON format
      const { stdout } = await execAsync(
        `docker network inspect ${networkName}`
      );

      const networkInfo = JSON.parse(stdout);
      if (!networkInfo || !networkInfo[0] || !networkInfo[0].Containers) {
        return [];
      }

      const containers = Object.values(networkInfo[0].Containers) as any[];
      const containerIds = containers.map(c => c.Name);

      // Get full container information for these IDs
      const allContainers = await this.getRunningContainers();
      return allContainers.filter(c => 
        containerIds.includes(c.name)
      );
    } catch (error) {
      console.error(chalk.red(`Error listing containers in network: ${(error as Error).message}`));
      return [];
    }
  }

  /**
   * Get container health information
   */
  async getContainerHealth(containerId: string): Promise<{
    status: string;
    uptime: string;
    cpu: string;
    memory: string;
    network: { rx: string; tx: string };
  }> {
    try {
      // Get container stats
      const stats = await execAsync(`docker stats ${containerId} --no-stream --format "{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"`);
      const [cpu, memory, netIO] = stats.stdout.split('\t');
      
      // Get container information
      const info = await execAsync(`docker inspect ${containerId}`);
      const containerInfo = JSON.parse(info.stdout)[0];
      
      // Calculate uptime
      const startTime = new Date(containerInfo.State.StartedAt);
      const uptime = this.formatUptime(Date.now() - startTime.getTime());
      
      // Get status (running, exited, etc.)
      const status = containerInfo.State.Status;
      
      // Parse network stats
      const [rx, tx] = netIO.split(' / ');
      
      return {
        status: status || 'unknown',
        uptime: uptime || 'N/A',
        cpu: cpu || 'N/A',
        memory: memory || 'N/A',
        network: {
          rx: rx || 'N/A',
          tx: tx || 'N/A'
        }
      };
    } catch (error) {
      console.error(`Error fetching container health: ${error}`);
      return {
        status: 'unknown',
        uptime: 'N/A',
        cpu: 'N/A',
        memory: 'N/A',
        network: { rx: 'N/A', tx: 'N/A' }
      };
    }
  }

  /**
   * Format uptime in human-readable form
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}