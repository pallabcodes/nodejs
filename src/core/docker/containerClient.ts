import { EventEmitter } from 'events';
import { DockerService, DockerContainer } from './dockerService';
import { ConnectionParameters } from '../connect';

// Define the structure of query results
export interface ContainerQueryResult {
  rows: any[];
  fields: any[];
  rowCount: number;
  duration: number;
}

export interface QueryOptions {
  database?: string;
  username?: string;
}

/**
 * Client adapter for running queries in Docker containers
 * Emulates the interface of node-postgres Client
 */
export class ContainerClient extends EventEmitter {
  private dockerService: DockerService;
  private container: DockerContainer;
  private username: string;
  private database: string;
  public connectionParameters: ConnectionParameters;
  private password: string;

  constructor(
    container: DockerContainer, 
    database: string, 
    username: string,
    password: string = 'admin#123' // Default password
  ) {
    super();
    this.dockerService = new DockerService();
    this.container = container;
    this.database = database;
    this.username = username;
    this.password = password;
    
    // For API compatibility with pg.Client
    this.connectionParameters = {
      database: this.database,
      user: this.username,
      host: `docker:${container.name}`,
      container: container.name
    };
  }

  /**
   * Simulate connecting to the database
   */
  async connect(): Promise<void> {
    try {
      // Test the connection by running a simple query
      await this.dockerService.runQueryInContainer(
        this.container,
        this.container.dbType === 'postgres' ? 'SELECT 1' : 'SELECT 1;',
        this.database,
        this.username
      );
      
      this.emit('connect');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Run a query in the container
   * Modified to accept both params array or options object for compatibility
   */
  async query(queryText: string, paramsOrOptions?: any[] | QueryOptions): Promise<ContainerQueryResult> {
    const start = Date.now();
    this.queryStartTime = start;
    
    try {
      // Execute the query in the container
      const result = await this.dockerService.runQueryInContainer(
        this.container,
        queryText,
        this.database,
        this.username,
        this.password
      );
      
      // Process the result - critical part!
      const duration = Date.now() - start;
      
      // Check if the result is in MySQL table format (has separator lines)
      if (result.includes('|') && result.includes('+---')) {
        return this.processMySQLTableOutput(result);
      }
      
      // Otherwise fall back to tab-delimited parsing
      const lines = result.trim().split('\n');
      
      if (lines.length === 0) {
        return { rows: [], fields: [], rowCount: 0, duration };
      }
      
      const columnNames = lines[0].split('\t');
      const fields = columnNames.map(name => ({ name }));
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row: Record<string, any> = {};
        
        columnNames.forEach((col, index) => {
          row[col] = values[index] || '';
        });
        
        rows.push(row);
      }
      
      return {
        rows,
        fields,
        rowCount: rows.length,
        duration
      };
    } catch (error) {
      // Check if it's just the password warning
      if (error instanceof Error && 
          error.message.includes('Using a password on the command line interface can be insecure')) {
        // Ignore this warning, it's not a real error
        // Add the duration property to match the ContainerQueryResult interface
        return {
          rows: [],
          fields: [],
          rowCount: 0,
          duration: Date.now() - start  // Add the missing duration property
        };
      }
      throw new Error(`Query error: ${(error as Error).message}`);
    }
  }

  /**
   * Close the connection
   */
  async end(): Promise<void> {
    // No persistent connection to close with Docker exec
    this.emit('end');
    return Promise.resolve();
  }
  
  /**
   * Get container information
   */
  getContainerInfo(): DockerContainer {
    return this.container;
  }
  
  /**
   * Change the current database
   */
  async useDatabase(database: string): Promise<void> {
    // Test if the database exists
    const dbList = await this.dockerService.listDatabases(this.container);
    
    if (!dbList.includes(database)) {
      throw new Error(`Database "${database}" does not exist`);
    }
    
    this.database = database;
    this.connectionParameters.database = database;
  }
  
  /**
   * Process query results with proper column names
   */
  private processQueryResult(result: string): ContainerQueryResult {
    // Check if result is JSON (our enhanced format)
    if (result.startsWith('{') && result.endsWith('}')) {
      try {
        const parsed = JSON.parse(result);
        const columnNames = parsed.columnNames;
        const lines = parsed.data.split('\n');
        
        const rows = [];
        for (let i = 0; i < lines.length; i++) {
          const values = lines[i].split('\t');
          const row: Record<string, any> = {};
          
          columnNames.forEach((col: string, index: number) => {
            row[col] = values[index] || '';
          });
          
          rows.push(row);
        }
        
        return {
          rows,
          fields: columnNames.map(name => ({ name })),
          rowCount: rows.length,
          duration: Date.now() - this.queryStartTime
        };
      } catch (error) {
        console.error('Error parsing JSON result:', error);
        // Fall back to old method if JSON parsing fails
      }
    }
    
    // Original method as fallback
    const lines = result.trim().split('\n');
    
    if (lines.length === 0) {
      return { rows: [], fields: [], rowCount: 0, duration: 0 };
    }
    
    // First line contains column names or will be default names
    let columnNames;
    
    // Try to detect if we have actual column names in the first row
    const firstLine = lines[0];
    if (firstLine.includes('|') && firstLine.trim().startsWith('|')) {
      // This looks like a MySQL table format, extract column names
      columnNames = firstLine
        .split('|')
        .map(col => col.trim())
        .filter(col => col);
    } else {
      // Use default column names
      columnNames = lines[0].split('\t');
      // If column names look numeric, they're probably default
      if (columnNames.every(col => /column\d+/.test(col))) {
        // Try to get real column names by querying the database structure
        // (This is a fallback and may not have the actual names)
      }
    }
    
    // Create fields array
    const fields = columnNames.map(name => ({ name }));
    
    // Process data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row: Record<string, any> = {};
      
      columnNames.forEach((col, index) => {
        row[col] = values[index] || '';
      });
      
      rows.push(row);
    }
    
    return {
      rows,
      fields,
      rowCount: rows.length,
      duration: Date.now() - this.queryStartTime
    };
  }
  
  /**
   * Process MySQL table format output into structured data
   */
  private processMySQLTableOutput(tableOutput: string): ContainerQueryResult {
    const start = this.queryStartTime || Date.now() - 100;
    const duration = Date.now() - start;
    
    // If no output, return empty result
    if (!tableOutput || tableOutput.trim() === '') {
      return { rows: [], fields: [], rowCount: 0, duration };
    }
    
    const lines = tableOutput.trim().split('\n');
    
    // MySQL table format has separator lines like +----+----+
    if (lines.length < 3 || !lines[0].startsWith('+')) {
      return { rows: [], fields: [], rowCount: 0, duration };
    }
    
    // Extract column headers from the second line
    // Format is: | Column1 | Column2 | Column3 |
    const headerLine = lines[1];
    const headers = headerLine.split('|')
      .map(h => h.trim())
      .filter(h => h !== '');
    
    const fields = headers.map(name => ({ name }));
    
    // Data rows start after the second separator line (index 3)
    const dataRows = [];
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip separator lines
      if (line.startsWith('+') || line.trim() === '') continue;
      
      // Process data row
      const rowValues = line.split('|')
        .map(v => v.trim())
        .filter((_, index) => index > 0 && index <= headers.length);
    
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        // Convert NULL string to actual null
        let value = rowValues[index];
        if (value === 'NULL') value = null;
        row[header] = value;
      });
      
      dataRows.push(row);
    }
    
    return {
      rows: dataRows,
      fields,
      rowCount: dataRows.length,
      duration
    };
  }
}