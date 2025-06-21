import { connectDB } from './src/core/connect';
import { runQuery } from './src/core/runQuery';
import { loadSchema } from './src/core/schemaLoader';
import { renderTable } from './src/core/renderer';
import { InteractiveCLI } from './src/core/interactive';
import { HistoryManager } from './src/core/historyManager';
import { PerformanceTracker } from './src/core/performanceTracker';
import { DockerConnector } from './src/core/docker/dockerConnector';
import chalk from 'chalk';
import { DockerService } from './src/core/docker/dockerService';

// Parse command-line arguments
const args = process.argv.slice(2);

async function main() {
  try {
    // Define options object
    const options = {
      docker: args.includes('--docker') || args.includes('-d')
    };
    
    // Handle special commands
    if (args[0] === 'history') {
      return handleHistoryCommand(args.slice(1));
    }
    
    if (args[0] === 'perf' || args[0] === 'performance') {
      return handlePerformanceCommand(args.slice(1));
    }
    
    if (args[0] === 'docker') {
      return handleDockerCommand(args.slice(1));
    }
    
    // Determine if we should use Docker
    const useDocker = options.docker;
    
    // Check if interactive mode is requested
    const isInteractive = args.length === 0 || 
                         args[0] === '--interactive' || 
                         args[0] === '-i' ||
                         useDocker; // Docker mode defaults to interactive
    
    // Connect to database (direct or via Docker)
    const client = await connectDB({ docker: useDocker });
    console.log(chalk.green('🔗 Connected to DB'));
    
    if (isInteractive) {
      // Interactive mode
      const cli = new InteractiveCLI(client);
      await cli.start();
    } else {
      // One-off query mode
      const schema = await loadSchema(client);
      console.log(chalk.cyan('📦 Loaded schema:'), Object.keys(schema).join(', '));
      
      // Remove CLI flags from input
      const queryArgs = args.filter(arg => !arg.startsWith('-'));
      const input = queryArgs.join(' ') || 'SELECT * FROM users LIMIT 5';
      
      const result = await runQuery(client, input);
      
      console.log(chalk.green(`⏱ Executed in ${result.duration}ms, ${result.rowCount || 0} rows`));
      renderTable(result.fields, result.rows);
      
      // Save to history
      const dbName = client.connectionParameters?.database || 'unknown';
      const historyManager = new HistoryManager();
      historyManager.addEntry(input, {
        database: dbName,
        duration: result.duration,
        rowCount: result.rowCount
      });
      
      await client.end();
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function handleHistoryCommand(args: string[]) {
  const historyManager = new HistoryManager();
  
  if (args.length === 0 || args[0] === 'list') {
    // Show history
    const limit = args[1] ? parseInt(args[1]) : 20;
    const entries = historyManager.getEntries(limit);
    
    if (entries.length === 0) {
      console.log(chalk.yellow('No history entries found'));
      return;
    }
    
    console.log(chalk.cyan(`Last ${entries.length} queries:`));
    const formatted = historyManager.formatEntries(entries, { 
      showTimestamp: true, 
      showDuration: true 
    });
    formatted.forEach(line => console.log(line));
    
  } else if (args[0] === 'clear') {
    // Clear history
    historyManager.clear();
    console.log(chalk.green('History cleared'));
    
  } else if (args[0] === 'search' && args.length > 1) {
    // Search history
    const term = args.slice(1).join(' ');
    const results = historyManager.search(term);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`No results found for '${term}'`));
      return;
    }
    
    console.log(chalk.cyan(`Found ${results.length} queries containing '${term}':`));
    const formatted = historyManager.formatEntries(results, { showTimestamp: true });
    formatted.forEach(line => console.log(line));
    
  } else if (args[0] === 'run' && args.length > 1) {
    // Run a query from history
    const index = parseInt(args[1]);
    
    if (isNaN(index) || index <= 0) {
      console.log(chalk.red('Invalid history index'));
      return;
    }
    
    const entries = historyManager.getEntries();
    
    if (index > entries.length) {
      console.log(chalk.red(`History item #${index} not found`));
      return;
    }
    
    const query = entries[index - 1].query;
    console.log(chalk.cyan(`Running: ${query}`));
    
    // Re-execute the selected query
    process.argv = [process.argv[0], process.argv[1], ...query.split(' ')];
    await main();
    
  } else {
    console.log(chalk.red('Unknown history command'));
    console.log('Usage:');
    console.log('  tq history [limit]      Show last N queries');
    console.log('  tq history search <term> Search history');
    console.log('  tq history run <number>  Run query from history');
    console.log('  tq history clear        Clear history');
  }
}

async function handlePerformanceCommand(args: string[]) {
  const tracker = new PerformanceTracker();
  
  if (args.length === 0 || args[0] === 'list') {
    // Show performance stats
    const patterns = tracker.getAllPatterns();
    
    if (patterns.length === 0) {
      console.log(chalk.yellow('No performance data available'));
      return;
    }
    
    console.log(chalk.cyan(`Found ${patterns.length} query patterns:`));
    
    // Show the 5 slowest queries
    const slowest = patterns
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);
    
    console.log(chalk.yellow('\nSlowest queries:'));
    slowest.forEach(pattern => {
      console.log(tracker.formatPattern(pattern, { showQuery: true }));
      console.log('');
    });
    
  } else if (args[0] === 'slow') {
    // Show slow queries
    const threshold = args[1] ? parseInt(args[1]) : 500;
    const slow = tracker.getSlowPatterns(threshold);
    
    if (slow.length === 0) {
      console.log(chalk.green(`No slow queries (> ${threshold}ms) found`));
      return;
    }
    
    console.log(chalk.yellow(`${slow.length} slow queries (> ${threshold}ms):`));
    slow.forEach(pattern => {
      console.log(tracker.formatPattern(pattern, { showQuery: true }));
      console.log('');
    });
    
  } else if (args[0] === 'clear') {
    // Clear performance data
    tracker.clear();
    console.log(chalk.green('Performance data cleared'));
    
  } else {
    console.log(chalk.yellow('Usage:'));
    console.log('  tq perf [list]        Show performance statistics');
    console.log('  tq perf slow [ms]     Show slow queries (threshold in ms)');
    console.log('  tq perf clear         Clear performance data');
  }
}

async function handleDockerCommand(args: string[]) {
  const dockerConnector = new DockerConnector();
  
  if (!await dockerConnector.isDockerAvailable()) {
    console.error(chalk.red('Docker is not available. Make sure Docker is installed and running.'));
    return;
  }
  
  if (args.length === 0 || args[0] === 'list') {
    // List Docker containers
    const dockerService = new DockerConnector().dockerService;
    const containers = await dockerService.getDatabaseContainers();
    
    if (containers.length === 0) {
      console.log(chalk.yellow('No database containers found'));
      return;
    }
    
    console.log(chalk.cyan('Database containers:'));
    containers.forEach((container, i) => {
      console.log(chalk.white(`${i + 1}. ${container.name} - ${container.image} - ${container.status}`));
      console.log(chalk.gray(`   ID: ${container.id}`));
      console.log(chalk.gray(`   Type: ${container.dbType}`));
      console.log(chalk.gray(`   Ports: ${container.ports}`));
      console.log('');
    });
  
  } else if (args[0] === 'networks') {
    // List Docker networks
    const dockerService = new DockerService();
    const networks = await dockerService.getDockerNetworks();
    
    console.log(chalk.cyan('Docker networks:'));
    for (const network of networks) {
      console.log(chalk.white(` • ${network}`));
    }
  
  } else if (args[0] === 'network' && args[1]) {
    // Show containers in a specific network
    const networkName = args[1];
    const dockerService = new DockerService();
    
    const containers = await dockerService.getContainersInNetwork(networkName);
    
    if (containers.length === 0) {
      console.log(chalk.yellow(`No database containers found in network "${networkName}"`));
      return;
    }
    
    console.log(chalk.cyan(`Containers in network "${networkName}":`));
    containers.forEach((container, i) => {
      console.log(chalk.white(`${i + 1}. ${container.name} - ${container.image}`));
      if (container.dbType !== 'unknown') {
        console.log(chalk.gray(`   Type: ${container.dbType} database`));
      }
    });
  
  } else if (args[0] === 'connect') {
    // Connect to a container in interactive mode
    
    // Check if network was specified
    if (args[1] === '--network' && args[2]) {
      const networkName = args[2];
      
      // Set environment variable to be read by connectDB
      process.env.TQ_DOCKER_NETWORK = networkName;
      console.log(chalk.cyan(`Limiting to containers in network: ${networkName}`));
    }
    
    process.argv = [process.argv[0], process.argv[1], '--docker'];
    await main();
  
  } else if (args[0] === 'health' && args[1]) {
    // Check health of a specific container
    const containerName = args[1];
    const dockerService = new DockerService();
    
    const containers = await dockerService.getRunningContainers();
    const container = containers.find(c => c.name === containerName || c.id === containerName);
    
    if (!container) {
      console.log(chalk.red(`Container not found: ${containerName}`));
      return;
    }
    
    // Import the health monitor
    const { DockerHealthMonitor } = await import('./src/core/docker/dockerHealth');
    const healthMonitor = new DockerHealthMonitor();
    
    console.log(chalk.cyan(`Fetching health for container: ${container.name}`));
    const health = await healthMonitor.getContainerHealth(container);
    
    // Display health info with appropriate colors
    console.log(chalk.cyan('Container health:'));
    
    let statusColor = chalk.yellow;
    if (health.status === 'healthy') statusColor = chalk.green;
    if (health.status === 'unhealthy') statusColor = chalk.red;
    
    console.log(`Status: ${statusColor(health.status)}`);
    console.log(`Uptime: ${chalk.white(health.uptime)}`);
    console.log(`CPU: ${chalk.white(health.cpuUsage)}`);
    console.log(`Memory: ${chalk.white(health.memoryUsage)} / ${health.memoryLimit}`);
    console.log(`Network: ↓${chalk.blue(health.networkRx)} / ↑${chalk.magenta(health.networkTx)}`);
  
  } else {
    console.log(chalk.yellow('Usage:'));
    console.log('  tq docker list                 List database containers');
    console.log('  tq docker connect              Connect to a container interactively');
    console.log('  tq docker connect --network <name>  Connect to container in specific network');
    console.log('  tq docker networks             List Docker networks');
    console.log('  tq docker network <name>       List containers in a network');
    console.log('  tq docker health <name>        Show container health metrics');
    console.log('  tq --docker                    Run in Docker mode');
  }
}

main();
