import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface DockerContainer {
  id: string;
  names: string;
  image: string;
  status: string;
  ports: string;
}

interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DockerManager {
  /**
   * List all running containers that might be databases
   */
  async listDatabaseContainers(): Promise<DockerContainer[]> {
    try {
      const { stdout } = await execAsync(
        'docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}"'
      );
      
      const containers = stdout
        .trim()
        .split('\n')
        .map(line => {
          const [id, names, image, status, ports] = line.split('|');
          return { id, names, image, status, ports };
        })
        .filter(container => {
          const imageLower = container.image.toLowerCase();
          return (
            imageLower.includes('postgres') ||
            imageLower.includes('mysql') ||
            imageLower.includes('mariadb') ||
            imageLower.includes('mongo') ||
            imageLower.includes('sql')
          );
        });
      
      return containers;
    } catch (error) {
      console.error(chalk.red('Error listing Docker containers:'), error);
      return [];
    }
  }

  /**
   * Auto-detect database credentials from a Docker container
   */
  async detectDatabaseCredentials(containerId: string): Promise<DatabaseConnection | null> {
    try {
      // First try to get environment variables from the container
      const { stdout: envOutput } = await execAsync(`docker inspect --format='{{range .Config.Env}}{{.}} {{end}}' ${containerId}`);
      
      const envVars = envOutput.split(' ').reduce((vars, envVar) => {
        const [key, ...valueParts] = envVar.split('=');
        if (key && valueParts.length) {
          vars[key] = valueParts.join('=');
        }
        return vars;
      }, {} as Record<string, string>);
      
      // Detect database type
      const { stdout: imageOutput } = await execAsync(`docker inspect --format='{{.Config.Image}}' ${containerId}`);
      const image = imageOutput.toLowerCase();
      
      // Find port mappings
      const { stdout: portMappingsOutput } = await execAsync(
        `docker port ${containerId}`
      );
      const portMappings = portMappingsOutput.trim().split('\n').reduce((mappings, line) => {
        const [containerPort, hostMapping] = line.split(' -> ');
        if (hostMapping) {
          const [hostIp, hostPort] = hostMapping.split(':');
          mappings[containerPort] = { hostIp, hostPort: parseInt(hostPort, 10) };
        }
        return mappings;
      }, {} as Record<string, { hostIp: string, hostPort: number }>);
      
      // Determine connection details based on database type
      let connection: DatabaseConnection | null = null;
      
      if (image.includes('postgres')) {
        const port = this.findPort(portMappings, '5432/tcp');
        connection = {
          host: 'localhost',
          port: port || 5432,
          database: envVars.POSTGRES_DB || envVars.PGDATABASE || 'postgres',
          user: envVars.POSTGRES_USER || envVars.PGUSER || 'postgres',
          password: envVars.POSTGRES_PASSWORD || envVars.PGPASSWORD || 'postgres'
        };
      } else if (image.includes('mysql') || image.includes('mariadb')) {
        const port = this.findPort(portMappings, '3306/tcp');
        connection = {
          host: 'localhost',
          port: port || 3306,
          database: envVars.MYSQL_DATABASE || 'mysql',
          user: envVars.MYSQL_USER || 'root',
          password: envVars.MYSQL_PASSWORD || envVars.MYSQL_ROOT_PASSWORD || ''
        };
      }
      
      return connection;
    } catch (error) {
      console.error(chalk.red('Error detecting database credentials:'), error);
      return null;
    }
  }
  
  private findPort(portMappings: Record<string, { hostIp: string, hostPort: number }>, defaultPort: string): number | null {
    for (const [containerPort, mapping] of Object.entries(portMappings)) {
      if (containerPort === defaultPort || containerPort.startsWith(defaultPort.split('/')[0])) {
        return mapping.hostPort;
      }
    }
    return null;
  }

  /**
   * Get connection string for a detected database
   */
  getConnectionString(connection: DatabaseConnection): string {
    // Currently supporting only PostgreSQL
    return `postgres://${connection.user}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
  }
  
  /**
   * Execute a command inside a docker container
   */
  async execInContainer(containerId: string, command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`docker exec ${containerId} ${command}`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to execute command in container: ${(error as Error).message}`);
    }
  }
}