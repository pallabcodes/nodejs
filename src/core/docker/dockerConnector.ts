import readline from 'readline';
import chalk from 'chalk';
import { DockerService, DockerContainer, ContainerConnectionInfo } from './dockerService';
import { ContainerClient } from './containerClient';
import mysql from 'mysql2/promise'; // Use mysql2 with promise support

export class DockerConnector {
  dockerService: DockerService;
  
  constructor() {
    this.dockerService = new DockerService();
  }
  
  /**
   * Check if Docker is available
   */
  async isDockerAvailable(): Promise<boolean> {
    return await this.dockerService.isDockerAvailable();
  }
  
  /**
   * Display a list of database containers and let user select one
   */
  async selectDatabaseContainer(): Promise<ContainerConnectionInfo | null> {
    const isDockerAvailable = await this.isDockerAvailable();
    
    if (!isDockerAvailable) {
      console.error(chalk.red('Docker is not available. Make sure Docker is installed and running.'));
      return null;
    }
    
    const containers = await this.dockerService.getDatabaseContainers();
    
    if (containers.length === 0) {
      console.error(chalk.yellow('No database containers found. Make sure your containers are running.'));
      return null;
    }
    
    // Display containers
    console.log(chalk.cyan('Found database containers:'));
    
    containers.forEach((container, index) => {
      console.log(chalk.white(`${index + 1}. ${container.name} (${container.image}) - ${container.status}`));
    });
    
    // Prompt user to select a container
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question(chalk.yellow('\nSelect a container by number: '), resolve);
    });
    
    rl.close();
    
    const selection = parseInt(answer);
    
    if (isNaN(selection) || selection < 1 || selection > containers.length) {
      console.error(chalk.red('Invalid selection'));
      return null;
    }
    
    const selectedContainer = containers[selection - 1];
    console.log(chalk.green(`Selected container: ${selectedContainer.name}`));
    
    // Get connection information
    const connectionInfo = await this.dockerService.getConnectionInfo(selectedContainer);
    
    if (!connectionInfo) {
      console.error(chalk.red(`Could not determine connection information for ${selectedContainer.name}`));
      return null;
    }
    
    return connectionInfo;
  }
  
  /**
   * Connect to a specific database container
   */
  async connectToContainer(container: DockerContainer, database?: string, username?: string): Promise<ContainerClient | null> {
    try {
      // Get connection info if not provided
      if (!database || !username) {
        const connectionInfo = await this.dockerService.getConnectionInfo(container);
        
        if (!connectionInfo) {
          throw new Error(`Could not determine connection information for ${container.name}`);
        }
        
        database = database || connectionInfo.defaultDatabase;
        username = username || connectionInfo.username;
      }
      
      // Create a client for the container
      const client = new ContainerClient(container, database, username);
      
      console.log(chalk.yellow(`Connecting to ${container.dbType} in container ${container.name}...`));
      await client.connect();
      
      console.log(chalk.green(`Connected to ${database} as ${username}`));
      return client;
    } catch (error) {
      console.error(chalk.red(`Error connecting to container: ${(error as Error).message}`));
      return null;
    }
  }
  
  /**
   * Select a database inside the container
   */
  async selectDatabase(container: DockerContainer): Promise<string | null> {
    try {
      const databases = await this.dockerService.listDatabases(container);
      
      if (databases.length === 0) {
        console.error(chalk.yellow('No databases found in container.'));
        return null;
      }
      
      console.log(chalk.cyan('Available databases:'));
      databases.forEach((db, i) => {
        console.log(chalk.white(`${i + 1}. ${db}`));
      });
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question(chalk.yellow('\nSelect a database by number: '), resolve);
      });
      
      rl.close();
      
      const selection = parseInt(answer);
      
      if (isNaN(selection) || selection < 1 || selection > databases.length) {
        console.error(chalk.red('Invalid selection'));
        return null;
      }
      
      return databases[selection - 1];
    } catch (error) {
      console.error(chalk.red(`Error listing databases: ${(error as Error).message}`));
      return null;
    }
  }
  
  /**
   * Create a MySQL client using the connection info
   */
  async createMySQLClient(connectionInfo: ContainerConnectionInfo) {
    try {
      // Create connection using mysql2/promise
      const connection = await mysql.createConnection({
        host: connectionInfo.host || 'localhost',
        port: connectionInfo.port || 3306,
        user: connectionInfo.user || connectionInfo.username,
        password: connectionInfo.password || 'admin#123',
        database: connectionInfo.defaultDatabase,
        // Add any other necessary options
      });
      
      // Test the connection
      await connection.query('SELECT 1');
      return connection;
    } catch (error) {
      throw new Error(`Failed to create MySQL client: ${(error as Error).message}`);
    }
  }
}