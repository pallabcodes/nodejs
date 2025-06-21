import { Client } from 'pg';
import chalk from 'chalk';
import * as readline from 'readline';

// Fix import paths - make sure these files exist at these locations
import { DockerConnector } from './docker/dockerConnector';
import { QueryOptions } from './docker/containerClient';
import { ContainerConnectionInfo } from './docker/dockerService';
// Remove unused imports while keeping what we need

// Define a common interface that both Client types must implement
export interface ConnectionParameters {
  database?: string;
  user?: string;
  host?: string;
  container?: string;
}

// Fix #2: Update UniversalClient to work with both client types
export type UniversalClient = {
  connectionParameters?: ConnectionParameters;
  // Make query method accept both parameter types
  query: (text: string, params?: any[] | QueryOptions) => Promise<any>;
  end: () => Promise<void>;
};

/**
 * Connect to a database - either directly or via Docker
 */
export async function connectDB(options?: { docker?: boolean }): Promise<UniversalClient> {
  // Check if Docker mode is explicitly specified or should be auto-detected
  const useDocker = options?.docker || process.env.TQ_DOCKER === 'true';
  
  if (useDocker) {
    return connectViaDocker();
  } else {
    return connectDirect();
  }
}

/**
 * Connect to a database directly (without Docker)
 */
async function connectDirect(): Promise<UniversalClient> { // Change return type to UniversalClient
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  
  const client = new Client({
    connectionString,
  });
  
  // Add connectionParameters property to match our interface
  (client as any).connectionParameters = {
    database: client.database || 'postgres',
    user: client.user || 'postgres',
    host: client.host || 'localhost'
  };
  
  await client.connect();
  return client as UniversalClient; // Cast to UniversalClient
}

/**
 * Connect to a database through Docker container
 */
async function connectViaDocker(): Promise<UniversalClient> {
  const dockerConnector = new DockerConnector();
  
  // Check if Docker is available
  if (!await dockerConnector.isDockerAvailable()) {
    throw new Error('Docker is not available. Make sure Docker is installed and running.');
  }
  
  // Check if we should limit to a specific network
  const networkName = process.env.TQ_DOCKER_NETWORK;
  let connectionInfo: ContainerConnectionInfo | null;
  
  if (networkName) {
    console.log(chalk.cyan(`Looking for containers in network: ${networkName}`));
    
    // Get containers in the specified network
    const containers = await dockerConnector.dockerService.getContainersInNetwork(networkName);
    
    if (containers.length === 0) {
      throw new Error(`No database containers found in network: ${networkName}`);
    }
    
    // Use manual selection if there are multiple containers
    if (containers.length > 1) {
      // Display containers
      console.log(chalk.cyan(`Found database containers in network ${networkName}:`));
      
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
        throw new Error('Invalid selection');
      }
      
      const selectedContainer = containers[selection - 1];
      console.log(chalk.green(`Selected container: ${selectedContainer.name}`));
      
      // Get connection information
      connectionInfo = await dockerConnector.dockerService.getConnectionInfo(selectedContainer);
    } else {
      // Only one container, use it automatically
      console.log(chalk.green(`Using container: ${containers[0].name}`));
      connectionInfo = await dockerConnector.dockerService.getConnectionInfo(containers[0]);
    }
  } else {
    // Normal container selection
    connectionInfo = await dockerConnector.selectDatabaseContainer();
  }
  
  if (!connectionInfo) {
    throw new Error('Failed to connect to a Docker container');
  }
  
  // Select a database
  let database = connectionInfo.defaultDatabase;
  let username = connectionInfo.username;
  
  if (connectionInfo.container.dbType === 'postgres' || connectionInfo.container.dbType === 'mysql') {
    const selectedDb = await dockerConnector.selectDatabase(connectionInfo.container);
    if (selectedDb) {
      database = selectedDb;
    }
  }
  
  // Connect to the selected container and database
  const client = await dockerConnector.connectToContainer(connectionInfo.container, database, username);
  
  if (!client) {
    throw new Error('Failed to create client for Docker container');
  }
  
  return client;
}
