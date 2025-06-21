import chalk from 'chalk';
import readline from 'readline';
import figures from 'figures';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { SQLCompleter } from './autocomplete';
import { loadSchema } from './schemaLoader';
import { runQuery } from './runQuery';
import { renderTable } from './renderer';
import { HistoryManager } from './historyManager';
import { PerformanceTracker } from './performanceTracker';
import { DockerConnector } from '../core/docker/dockerConnector';
import { ContainerClient } from './docker/containerClient';
import { UniversalClient } from './connect';
import { ExportFormat, ExportOptions } from './export/exporter';

export class InteractiveCLI {
  private rl: readline.Interface;
  private client: UniversalClient;
  private completer: SQLCompleter;
  private historyManager: HistoryManager;
  private dbName: string;
  private isDockerClient: boolean;
  private lastResults: {
    fields: any[];
    rows: any[];
  } | null = null; // Store the last query results here
  
  constructor(client: UniversalClient) {
    this.client = client;
    this.completer = new SQLCompleter();
    this.historyManager = new HistoryManager();
    
    // Check if this is a Docker container client
    this.isDockerClient = 'getContainerInfo' in client;
    
    // Extract database name for history context
    this.dbName = client.connectionParameters?.database || 'unknown';
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.getCompleter(),
      terminal: true,
      historySize: 100,
    });
    
    // Load history into readline
    const history = this.historyManager.getReadlineHistory();
    history.reverse().forEach(query => {
      // @ts-expect-error type mismatch, but readline accepts strings
      this.rl.history.push(query);
    });
  }
  
  private getCompleter() {
    return (line: string) => {
      const completions = this.completer.getCompletions(line, line.length);
      return [completions, line];
    };
  }
  
  async start(): Promise<void> {
    // Display welcome message
    console.log('\n');
    const header = gradient.rainbow.multiline(`
  ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗         
  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║         
     ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║         
     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║         
     ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗    
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝    
                                                                       
   ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗                          
  ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝                          
  ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝                           
  ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝                            
  ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║                             
   ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝                             
    `);
    
    console.log(header);
    console.log(
      boxen(
        chalk.cyan(`Connected to ${chalk.bold(this.dbName)} as ${chalk.bold('user')}`),
        { padding: 1, borderStyle: 'round', borderColor: 'cyan', title: 'Database Connection' }
      )
    );
    
    console.log(`\n${chalk.green(figures.tick)} ${chalk.bold('Type SQL queries and press Enter to execute.')}`);
    console.log(`${chalk.blue(figures.info)} ${chalk.bold('Type .help for available commands or .exit to quit.')}\n`);

    // Load schema and set up completer
    console.log(chalk.cyan('🔍 Loading schema...'));
    const schema = await loadSchema(this.client);
    this.completer.loadSchema(schema);
    
    console.log(chalk.green(`📊 Connected to database ${chalk.bold(this.dbName)} with ${Object.keys(schema).length} tables`));
    
    // Set up prompt
    this.prompt();
    
    // Set up line handler
    this.rl.on('line', this.handleLine.bind(this));
  }
  
  private prompt() {
    if (this.isDockerClient) {
      const containerClient = this.client as ContainerClient;
      const container = containerClient.getContainerInfo();
      this.rl.setPrompt(chalk.blue(`${container.name}:${this.dbName}> `));
    } else {
      this.rl.setPrompt(chalk.blue(`${this.dbName}> `));
    }
    this.rl.prompt();
  }
  
  private async handleLine(line: string) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      this.prompt();
      return;
    }
    
    // Handle dot commands
    if (trimmedLine.startsWith('.')) {
      await this.handleDotCommand(trimmedLine);
      return;
    }
    
    // Execute SQL query
    try {
      const startTime = Date.now();
      const result = await runQuery(this.client, line);
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`✓ Query executed in ${duration}ms, ${result.rowCount || 0} rows returned`));
      
      // Add to history
      this.historyManager.addEntry(line, {
        database: this.dbName,
        duration,
        rowCount: result.rowCount
      });
      
      // Store the results for potential export
      this.lastResults = {
        fields: result.fields,
        rows: result.rows
      };
      
      if (result.rows && result.rows.length > 0) {
        renderTable(result.fields, result.rows);
      } else {
        console.log(chalk.yellow('No rows returned'));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      // Still record failed queries with a marker
      this.historyManager.addEntry(`/* ERROR */ ${line}`, { database: this.dbName });
    }
    
    console.log(''); // Empty line for readability
    this.prompt();
  }
  
  private async handleDotCommand(command: string) {
    const parts = command.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    
    switch (cmd) {
      case 'exit':
      case 'quit':
        await this.close();
        return;
        
      case 'help':
        this.showHelp();
        break;
        
      case 'history':
        await this.showHistory(parts.slice(1));
        break;
        
      case 'clear':
        if (parts[1] === 'history') {
          this.historyManager.clear();
          console.log(chalk.green('History cleared'));
        } else {
          // Clear screen
          console.clear();
        }
        break;
        
      case 'search':
        const searchTerm = parts.slice(1).join(' ');
        await this.searchHistory(searchTerm);
        break;
        
      case 'run':
        const historyIndex = parseInt(parts[1]);
        await this.runHistoryItem(historyIndex);
        break;
        
      case 'perf':
      case 'performance':
        await this.showPerformanceStats(parts.slice(1));
        break;
        
      case 'similar':
        if (parts.length < 2) {
          console.log(chalk.yellow('Usage: .similar <query-id>'));
          break;
        }
        await this.showSimilarQueries(parts[1]);
        break;
        
      case 'explain':
        if (parts.length < 2) {
          console.log(chalk.yellow('Usage: .explain <query>'));
          break;
        }
        await this.explainQuery(parts.slice(1).join(' '));
        break;
        
      case 'docker':
        if (this.isDockerClient) {
          await this.handleDockerCommand(parts.slice(1));
        } else {
          console.log(chalk.yellow('Not connected to a Docker container. Use "tq --docker" to start in Docker mode.'));
        }
        break;
        
      case 'visualize':
      case 'viz':
        if (parts.length < 2) {
          console.log(chalk.yellow('Usage: .visualize <query>'));
          break;
        }
        await this.visualizeQuery(parts.slice(1).join(' '));
        break;
        
      case 'vq':
        // Visualize from history
        if (parts.length < 2 || isNaN(parseInt(parts[1]))) {
          console.log(chalk.yellow('Usage: .vq <history-number>'));
          break;
        }
        const index = parseInt(parts[1]);
        const entries = this.historyManager.getEntries();
        if (index <= 0 || index > entries.length) {
          console.log(chalk.red(`History item #${index} not found`));
          break;
        }
        const query = entries[index - 1].query;
        await this.visualizeQuery(query);
        break;
    
      case 'export':
      case 'save':
        await this.exportResults(parts.slice(1));
        break;
        
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log('Type .help for available commands');
    }
    
    this.prompt();
  }
  
  private async showHistory(args: string[]) {
    const limit = args.length > 0 ? parseInt(args[0]) : 10;
    const showDetails = args.includes('--details');
    
    const entries = this.historyManager.getEntries(limit);
    if (entries.length === 0) {
      console.log(chalk.yellow('No history entries'));
      return;
    }
    
    console.log(chalk.cyan(`Last ${entries.length} queries:`));
    const formatted = this.historyManager.formatEntries(entries, { 
      showTimestamp: showDetails,
      showDuration: showDetails
    });
    
    formatted.forEach(line => console.log(line));
    console.log(chalk.grey('\nTip: Use .run <number> to execute a query from history'));
  }
  
  private async searchHistory(term: string) {
    if (!term) {
      console.log(chalk.yellow('Usage: .search <term>'));
      return;
    }
    
    const results = this.historyManager.search(term);
    if (results.length === 0) {
      console.log(chalk.yellow(`No results found for '${term}'`));
      return;
    }
    
    console.log(chalk.cyan(`Found ${results.length} queries containing '${term}':`));
    const formatted = this.historyManager.formatEntries(results, { showTimestamp: true });
    formatted.forEach(line => console.log(line));
  }
  
  private async runHistoryItem(index: number) {
    if (isNaN(index) || index <= 0) {
      console.log(chalk.yellow('Usage: .run <history-number>'));
      return;
    }
    
    const entries = this.historyManager.getEntries();
    if (index > entries.length) {
      console.log(chalk.red(`History item #${index} not found`));
      return;
    }
    
    const query = entries[index - 1].query;
    console.log(chalk.cyan(`Running: ${query}`));
    
    // Re-execute the query
    await this.handleLine(query);
  }
  
  private async showPerformanceStats(args: string[]) {
    const tracker = new PerformanceTracker();
    
    if (args.length === 0 || args[0] === 'list') {
      // Show general stats
      const patterns = tracker.getAllPatterns();
      
      if (patterns.length === 0) {
        console.log(chalk.yellow('No performance data available yet'));
        return;
      }
      
      console.log(chalk.cyan(`Found ${patterns.length} query patterns:`));
      console.log('');
      
      // Show the 5 slowest queries
      const slowest = patterns
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 5);
      
      console.log(chalk.yellow('Slowest queries:'));
      slowest.forEach(pattern => {
        console.log(tracker.formatPattern(pattern, { showQuery: true }));
        console.log('');
      });
      
      // Show the most frequently executed
      const frequent = patterns
        .sort((a, b) => b.totalExecutions - a.totalExecutions)
        .slice(0, 5);
      
      console.log(chalk.yellow('Most frequent queries:'));
      frequent.forEach(pattern => {
        console.log(tracker.formatPattern(pattern));
      });
      
    } else if (args[0] === 'slow') {
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
      
    } else if (args[0] === 'detail' && args[1]) {
      const hash = args[1];
      const patterns = tracker.getAllPatterns();
      const pattern = patterns.find(p => p.fingerprint.hash === hash);
      
      if (!pattern) {
        console.log(chalk.red(`Pattern with hash ${hash} not found`));
        return;
      }
      
      console.log(chalk.cyan(`Query pattern: ${pattern.fingerprint.hash}`));
      console.log(chalk.white(`Normalized: ${pattern.fingerprint.normalized}`));
      console.log('');
      console.log(chalk.cyan('Stats:'));
      console.log(`  Executions: ${pattern.totalExecutions}`);
      console.log(`  Avg duration: ${pattern.avgDuration.toFixed(2)}ms`);
      console.log(`  Min duration: ${pattern.minDuration}ms`);
      console.log(`  Max duration: ${pattern.maxDuration}ms`);
      console.log(`  Last executed: ${new Date(pattern.lastExecuted).toLocaleString()}`);
      console.log(`  Performance trend: ${this.formatTrend(pattern.trend)}`);
      console.log('');
      
      // Show complexity analysis
      const complexity = pattern.fingerprint.complexity;
      console.log(chalk.cyan('Complexity analysis:'));
      console.log(`  Score: ${this.formatComplexityScore(complexity.score)}`);
      
      const factors = [];
      if (complexity.joinCount > 0) factors.push(`${complexity.joinCount} joins`);
      if (complexity.subqueryCount > 0) factors.push(`${complexity.subqueryCount} subqueries`);
      if (complexity.hasGroupBy) factors.push('GROUP BY');
      if (complexity.hasAggregate) factors.push('Aggregates');
      if (!complexity.hasLimit) factors.push('No LIMIT');
      
      if (factors.length > 0) {
        console.log(`  Factors: ${factors.join(', ')}`);
      }
      
      // Show latest executions
      console.log('');
      console.log(chalk.cyan('Recent executions:'));
      pattern.executions.slice(-5).forEach(exec => {
        console.log(`  ${new Date(exec.timestamp).toLocaleString()} - ${exec.duration}ms - ${exec.rowCount} rows`);
      });
      
      console.log('');
      console.log(chalk.cyan('Example query:'));
      console.log(pattern.executions[pattern.executions.length - 1].originalQuery);
      
    } else if (args[0] === 'clear') {
      tracker.clear();
      console.log(chalk.green('Performance data cleared'));
      
    } else {
      console.log(chalk.yellow('Usage:'));
      console.log('  .perf                Show general performance stats');
      console.log('  .perf slow [ms]      Show slow queries (default threshold: 500ms)');
      console.log('  .perf detail <hash>  Show details for a specific query pattern');
      console.log('  .perf clear          Clear all performance data');
    }
  }
  
  private async showSimilarQueries(queryIdOrSql: string) {
    // Check if it's a history index or a direct SQL query
    let sql: string;
    
    if (/^\d+$/.test(queryIdOrSql)) {
      // It's a history index
      const index = parseInt(queryIdOrSql);
      const entries = this.historyManager.getEntries();
      
      if (index <= 0 || index > entries.length) {
        console.log(chalk.red(`History item #${index} not found`));
        return;
      }
      
      sql = entries[index - 1].query;
    } else {
      // It's a direct SQL query
      sql = queryIdOrSql;
    }
    
    const tracker = new PerformanceTracker();
    const similar = tracker.getSimilarQueries(sql);
    
    if (similar.length === 0) {
      console.log(chalk.yellow('No similar queries found'));
      return;
    }
    
    console.log(chalk.cyan(`Found ${similar.length} similar queries:`));
    
    similar.forEach(({ pattern, similarity }) => {
      console.log(`${similarity}% similar - ${tracker.formatPattern(pattern)}`);
      
      if (similarity < 100) {
        console.log(chalk.gray(`  ${pattern.fingerprint.normalized}`));
      }
      
      console.log('');
    });
  }
  
  private async explainQuery(sql: string) {
    try {
      // Run EXPLAIN ANALYZE
      const explainSql = `EXPLAIN ANALYZE ${sql}`;
      const result = await this.client.query(explainSql);
      
      // Display the explain plan with coloring
      console.log(chalk.cyan('Execution plan:'));
      console.log('');
      
      // @ts-expect-error type mismatch
      result.rows.forEach(row => {
        let plan = row.QUERY_PLAN || row['QUERY PLAN'] || '';
        
        // Add coloring based on plan elements
        plan = plan
          .replace(/Seq Scan/g, chalk.red('Seq Scan'))
          .replace(/Index Scan/g, chalk.green('Index Scan'))
          // @ts-expect-error type mismatch
          .replace(/cost=([0-9.]+)\.\.([0-9.]+)/g, (_, start, end) => {
            const cost = parseFloat(end);
            let costStr = `cost=${start}..${end}`;
            if (cost > 1000) return chalk.red(costStr);
            if (cost > 100) return chalk.yellow(costStr);
            return chalk.green(costStr);
          })
          // @ts-expect-error type mismatch
          .replace(/rows=([0-9]+)/g, (_, rows) => {
            const rowCount = parseInt(rows);
            let rowStr = `rows=${rows}`;
            if (rowCount > 10000) return chalk.red(rowStr);
            if (rowCount > 1000) return chalk.yellow(rowStr);
            return chalk.green(rowStr);
          });
        
        console.log('  ' + plan);
      });
      
      // Find the fingerprint and show similar queries
      const tracker = new PerformanceTracker();
      const pattern = tracker.findPatternForQuery(sql);
      
      if (pattern) {
        console.log('');
        console.log(chalk.cyan('Performance history:'));
        console.log(tracker.formatPattern(pattern, { showQuery: false }));
        
        // Show some optimization tips based on plan and fingerprinting
        console.log('');
        this.suggestOptimizations(sql, pattern);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error explaining query: ${(error as Error).message}`));
    }
  }
  
  private suggestOptimizations(sql: string, pattern: any) {
    const lowerSql = sql.toLowerCase();
    const complexity = pattern.fingerprint.complexity;
    const suggestions = [];
    
    // Suggest adding a LIMIT clause
    if (!complexity.hasLimit && lowerSql.startsWith('select')) {
      suggestions.push('Add a LIMIT clause to restrict the result set');
    }
    
    // Suggest analyzing join efficiency for complex joins
    if (complexity.joinCount > 2) {
      suggestions.push('Review join conditions for potential optimizations');
    }
    
    // Suggest indexing for slow queries with WHERE clauses
    if (pattern.avgDuration > 500 && lowerSql.includes('where')) {
      suggestions.push('Consider adding indexes for columns used in WHERE clauses');
    }
    
    // Suggest optimization for slow aggregations
    if (complexity.hasAggregate && pattern.avgDuration > 500) {
      suggestions.push('Aggregation operations are expensive - consider pre-aggregating or using materialized views');
    }
    
    if (suggestions.length > 0) {
      console.log(chalk.yellow('Optimization suggestions:'));
      suggestions.forEach(suggestion => {
        console.log(`  • ${suggestion}`);
      });
    } else {
      console.log(chalk.green('Query looks well-optimized!'));
    }
  }
  
  // Helper methods for formatting
  private formatTrend(trend: string): string {
    switch (trend) {
      case 'improving': return chalk.green('Improving ↓');
      case 'stable': return chalk.blue('Stable →');
      case 'degrading': return chalk.red('Degrading ↑');
      default: return chalk.gray('Unknown');
    }
  }
  
  private formatComplexityScore(score: number): string {
    if (score < 30) return chalk.green(`${score} (Low)`);
    if (score < 60) return chalk.yellow(`${score} (Medium)`);
    return chalk.red(`${score} (High)`);
  }
  
  // Add this method if it doesn't exist
  displayWelcome() {
    // Create a beautiful header
    const header = gradient.rainbow.multiline(`
  ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗         
  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║         
     ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║         
     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║         
     ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗    
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝    
                                                                       
   ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗                          
  ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝                          
  ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝                           
  ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝                            
  ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║                             
   ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝                             
  `);
  
  console.log(header);
  
  // Use boxen for connection info
  console.log(
    boxen(
      chalk.cyan(`Connected to ${chalk.bold(this.dbName)} as ${chalk.bold('user')}`),
      { padding: 1, borderStyle: 'round', borderColor: 'cyan', title: 'Database Connection' }
    )
  );
  
  // Use figures for command information
  console.log(`\n${chalk.green(figures.tick)} ${chalk.bold('Type SQL queries and press Enter to execute.')}`);
  console.log(`${chalk.blue(figures.info)} ${chalk.bold('Type .help for available commands or .exit to quit.')}\n`);
}
  
  updatePrompt() {
    // Fix: Use this.dbName instead of this.database
    this.rl.setPrompt(chalk.magenta.bold(`${this.dbName}> `));
  }
  
  // Add helpful command hints
  displayHelp() {
    console.log(chalk.cyan('\nAvailable Commands:'));
    
    const commands = [
      ['.exit', 'Exit the application'],
      ['.help', 'Show this help message'],
      ['.tables', 'List all tables in current database'],
      ['.schema [table]', 'Show schema for a table'],
      ['.export json|csv [file]', 'Export last query result'],
      ['.visualize [query]', 'Create visual diagram of query relationships'],
      ['.history', 'Show query history'],
      ['.docker health', 'Check Docker container health']
    ];
    
    commands.forEach(([cmd, desc]) => {
      console.log(`  ${chalk.green(cmd.padEnd(20))} ${desc}`);
    });
    console.log();
  }
  
  private showHelp() {
    console.log(chalk.cyan('Available commands:'));
    console.log('  .exit, .quit      Exit the application');
    console.log('  .help             Show this help');
    console.log('  .history [n]      Show last n queries (default: 10)');
    console.log('  .search <term>    Search query history');
    console.log('  .run <number>     Run query from history by number');
    console.log('  .clear            Clear the screen');
    console.log('  .clear history    Clear query history');
    console.log('');
    
    console.log(chalk.cyan('Performance analysis:'));
    console.log('  .perf             Show performance statistics');
    console.log('  .perf slow [ms]   Show slow queries (threshold in ms)');
    console.log('  .perf detail <id> Show details for a query pattern');
    console.log('  .similar <id>     Find similar queries');
    console.log('  .explain <query>  Run EXPLAIN ANALYZE on a query');
    console.log('');
    
    console.log(chalk.cyan('Visualization:'));
    console.log('  .visualize <query>   Show visual diagram of table relationships');
    console.log('  .vq <number>         Visualize a query from history');
    console.log('');
    
    console.log(chalk.cyan('Export/Import:'));
    console.log('  .export csv [options]   Export last result as CSV');
    console.log('  .export json [options]  Export last result as JSON');
    console.log('  .export markdown        Export last result as markdown table');
    console.log('  .export sql             Export last result as SQL insert statements');
    console.log('  Options:');
    console.log('    --out/-o <filepath>   Save to file instead of displaying');
    console.log('    --pretty/-p           Pretty-print (for JSON)');
    console.log('    --no-headers          Exclude headers (for CSV)');
    console.log('');
    
    if (this.isDockerClient) {
      console.log(chalk.cyan('Docker commands:'));
      console.log('  .docker info         Show container information');
      console.log('  .docker health       Show container health metrics');
      console.log('  .docker dbs          List available databases');
      console.log('  .docker use <dbname>  Switch to another database');
      console.log('  .docker networks     List Docker networks');
      console.log('  .docker network <name>  Show containers in network');
      console.log('');
    }
    
    console.log(chalk.cyan('Tips:'));
    console.log('  • Press Tab for autocomplete');
    console.log('  • Use arrow keys to navigate history');
    console.log('  • Multi-line queries are supported');
    console.log('');
  }
  
  private async handleDockerCommand(args: string[]) {
    if (!this.isDockerClient) {
      console.log(chalk.yellow('Not connected to a Docker container.'));
      return;
    }
    
    const containerClient = this.client as ContainerClient;
    const container = containerClient.getContainerInfo();
    
    if (args.length === 0 || args[0] === 'info') {
      // Show container info
      console.log(chalk.cyan('Container information:'));
      console.log(chalk.white(`Name: ${container.name}`));
      console.log(chalk.white(`Image: ${container.image}`));
      console.log(chalk.white(`ID: ${container.id}`));
      console.log(chalk.white(`Status: ${container.status}`));
      console.log(chalk.white(`Database type: ${container.dbType}`));
      console.log(chalk.white(`Current database: ${this.dbName}`));
      
    } else if (args[0] === 'health') {
      // Show container health stats
      console.log(chalk.cyan('Fetching container health information...'));
      
      // Import the health monitor class
      const { DockerHealthMonitor } = await import('./docker/dockerHealth');
      const healthMonitor = new DockerHealthMonitor();
      
      const health = await healthMonitor.getContainerHealth(container);
      
      // Display health info with appropriate colors
      console.log(chalk.cyan('Container health:'));
      
      // Color status based on health
      let statusColor = chalk.yellow;
      if (health.status === 'healthy') statusColor = chalk.green;
      if (health.status === 'unhealthy') statusColor = chalk.red;
      
      console.log(`Status: ${statusColor(health.status)}`);
      console.log(`Uptime: ${chalk.white(health.uptime)}`);
      console.log(`CPU: ${chalk.white(health.cpuUsage)}`);
      console.log(`Memory: ${chalk.white(health.memoryUsage)} / ${health.memoryLimit}`);
      console.log(`Network: ↓${chalk.blue(health.networkRx)} / ↑${chalk.magenta(health.networkTx)}`);

    } else if (args[0] === 'networks') {
      // List Docker networks
      const { DockerService } = await import('./docker/dockerService');
      const dockerService = new DockerService();
      
      const networks = await dockerService.getDockerNetworks();
      
      console.log(chalk.cyan('Docker networks:'));
      for (const network of networks) {
        console.log(chalk.white(` • ${network}`));
      }

    } else if (args[0] === 'network' && args[1]) {
      // List containers in a specific network
      const networkName = args[1];
      const { DockerService } = await import('./docker/dockerService');
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
    
    } else if (args[0] === 'databases' || args[0] === 'dbs') {
      // List databases in container
      const dockerConnector = new DockerConnector();
      const databases = await dockerConnector.dockerService.listDatabases(container);
      
      console.log(chalk.cyan('Available databases:'));
      databases.forEach(db => {
        const isCurrent = db === this.dbName;
        console.log(`${isCurrent ? chalk.green('→ ') : '  '}${db}`);
      });
      
    } else if (args[0] === 'use' && args[1]) {
      // Switch database
      const newDb = args[1];
      
      try {
        await containerClient.useDatabase(newDb);
        this.dbName = newDb;
        console.log(chalk.green(`Switched to database: ${newDb}`));
        
        // Reload schema for the new database
        console.log(chalk.cyan('Loading schema...'));
        const schema = await loadSchema(this.client);
        this.completer.loadSchema(schema);
        console.log(chalk.green(`Loaded schema with ${Object.keys(schema).length} tables`));
        
      } catch (error) {
        console.error(chalk.red(`Error switching database: ${(error as Error).message}`));
      }
    } else {
      console.log(chalk.yellow('Docker commands:'));
      console.log('  .docker info         Show container information');
      console.log('  .docker health       Show container health metrics');
      console.log('  .docker dbs          List available databases');
      console.log('  .docker use <dbname>  Switch to another database');
      console.log('  .docker networks     List Docker networks');
      console.log('  .docker network <name>  Show containers in network');
    }
  }
  
  private async visualizeQuery(sql: string) {
    try {
      // Import the visualization modules
      const { SQLRelationshipExtractor } = await import('./visualization/sqlParser');
      const { DiagramRenderer } = await import('./visualization/diagramRenderer');
      
      // Parse the query
      const parser = new SQLRelationshipExtractor();
      const relationships = parser.extractRelationships(sql);
      const tableReferences = parser.extractTableReferences(sql);
      
      if (tableReferences.length === 0) {
        console.log(chalk.yellow('No tables found in the query.'));
        return;
      }
      
      console.log(chalk.cyan('Visualizing query relationships:'));
      console.log('');
      
      // Get schema for tables in the query
      const schema = await loadSchema(this.client);
      
      // Create and render the diagram
      const renderer = new DiagramRenderer();
      const diagram = renderer.renderRelationshipDiagram(
        relationships,
        tableReferences,
        schema
      );
      
      console.log(diagram);
      console.log('');
      
      // Show table statistics
      console.log(chalk.cyan('Query complexity:'));
      console.log(`Tables: ${tableReferences.length}`);
      console.log(`Relationships: ${relationships.length}`);
      
      // Show table aliases if any
      const aliases = tableReferences.filter(ref => ref.alias && ref.alias !== ref.table);
      if (aliases.length > 0) {
        console.log('');
        console.log(chalk.cyan('Table aliases:'));
        aliases.forEach(ref => {
          console.log(`${ref.table} AS ${ref.alias}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red(`Error visualizing query: ${(error as Error).message}`));
    }
  }
  
  // Add this new method to the InteractiveCLI class

  private async exportResults(args: string[]) {
    // Check if we have results from the last query
    if (!this.lastResults || !this.lastResults.rows || this.lastResults.rows.length === 0) {
      console.log(chalk.yellow('No results to export. Run a query first.'));
      return;
    }
    
    try {
      // Parse export options
      const options: ExportOptions = { format: 'csv' };
      
      for (let i = 0; i < args.length; i++) {
        const arg = args[i].toLowerCase();
        
        if (arg === 'json' || arg === 'csv' || arg === 'markdown' || arg === 'sql') {
          options.format = arg as ExportFormat;
        } else if (arg === '--pretty' || arg === '-p') {
          options.pretty = true;
        } else if (arg === '--no-headers') {
          options.includeHeaders = false;
        } else if (arg === '--out' || arg === '-o') {
          if (i + 1 < args.length) {
            options.filepath = args[++i];
          }
        }
      }
      
      // Import the exporter
      const { ResultExporter } = await import('./export/exporter');
      const exporter = new ResultExporter();
      
      // Export the results
      const { fields, rows } = this.lastResults;
      const result = await exporter.export(fields, rows, options);
      
      console.log(result);
      
    } catch (error) {
      console.error(chalk.red(`Export error: ${(error as Error).message}`));
    }
  }
  
  async close() {
    this.rl.close();
    await this.client.end();
    console.log(chalk.green('Disconnected from database. Goodbye!'));
    process.exit(0);
  }
}