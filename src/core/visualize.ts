import chalk from 'chalk';
import { Client } from 'pg';

interface TableRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesColumn?: string;
}

export class SchemaVisualizer {
  private client: Client;
  
  constructor(client: Client) {
    this.client = client;
  }
  
  /**
   * Load detailed schema with relationships
   */
  async loadDetailedSchema(): Promise<TableSchema[]> {
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tables = (await this.client.query(tablesQuery)).rows.map(row => row.table_name);
    const result: TableSchema[] = [];
    
    // Get primary keys
    const primaryKeysQuery = `
      SELECT c.table_name, c.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
      JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
          AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
      WHERE constraint_type = 'PRIMARY KEY' AND c.table_schema = 'public';
    `;
    const primaryKeys = (await this.client.query(primaryKeysQuery)).rows;
    
    // Get foreign keys
    const foreignKeysQuery = `
      SELECT
          tc.table_name as table_name,
          kcu.column_name as column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
      FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
    const foreignKeys = (await this.client.query(foreignKeysQuery)).rows;
    
    // Process each table
    for (const tableName of tables) {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await this.client.query(columnsQuery, [tableName]);
      
      const columns: ColumnInfo[] = columnsResult.rows.map(col => {
        const isPrimaryKey = primaryKeys.some(
          pk => pk.table_name === tableName && pk.column_name === col.column_name
        );
        
        const foreignKey = foreignKeys.find(
          fk => fk.table_name === tableName && fk.column_name === col.column_name
        );
        
        return {
          name: col.column_name,
          dataType: col.data_type,
          isPrimaryKey,
          isForeignKey: !!foreignKey,
          referencesTable: foreignKey?.foreign_table_name,
          referencesColumn: foreignKey?.foreign_column_name
        };
      });
      
      result.push({
        tableName,
        columns
      });
    }
    
    return result;
  }
  
  /**
   * Extract relationships
   */
  extractRelationships(schema: TableSchema[]): TableRelationship[] {
    const relationships: TableRelationship[] = [];
    
    for (const table of schema) {
      for (const column of table.columns) {
        if (column.isForeignKey && column.referencesTable && column.referencesColumn) {
          relationships.push({
            fromTable: table.tableName,
            fromColumn: column.name,
            toTable: column.referencesTable,
            toColumn: column.referencesColumn
          });
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Render ASCII representation of schema
   */
  renderSchemaVisual(schema: TableSchema[], relationships: TableRelationship[]): void {
    console.log(chalk.cyan.bold('\n=== DATABASE SCHEMA VISUALIZATION ===\n'));
    
    // Display tables with their columns
    for (const table of schema) {
      console.log(chalk.green.bold(`┌─ ${table.tableName} ─${'─'.repeat(30)}`));
      
      for (const column of table.columns) {
        let prefix = '│  ';
        let suffix = '';
        
        if (column.isPrimaryKey) {
          prefix = '│  ' + chalk.yellow('🔑 ');
          suffix += chalk.yellow(' (PK)');
        } else if (column.isForeignKey) {
          prefix = '│  ' + chalk.blue('🔗 ');
          suffix += chalk.blue(` (→ ${column.referencesTable}.${column.referencesColumn})`);
        } else {
          prefix = '│    ';
        }
        
        console.log(`${prefix}${column.name}: ${chalk.dim(column.dataType)}${suffix}`);
      }
      
      console.log(chalk.green('└─' + '─'.repeat(40)));
      console.log();
    }
    
    // Display relationships
    if (relationships.length > 0) {
      console.log(chalk.cyan.bold('\n=== TABLE RELATIONSHIPS ===\n'));
      
      for (const rel of relationships) {
        console.log(`${chalk.green(rel.fromTable)}.${chalk.yellow(rel.fromColumn)} ${chalk.dim('→')} ${chalk.green(rel.toTable)}.${chalk.yellow(rel.toColumn)}`);
      }
    }
  }
  
  /**
   * Analyze and visualize a specific query
   */
  async visualizeQuery(query: string): Promise<void> {
    try {
      console.log(chalk.cyan('Analyzing query...'));
      
      // We'll extract table names from the query using a simple regex
      // This is a basic approach - for production, you'd want a proper SQL parser
      const tableNameRegex = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi;
      const matches = [...query.matchAll(tableNameRegex)];
      const mentionedTables = [...new Set(matches.map(match => match[1].toLowerCase()))];
      
      if (mentionedTables.length === 0) {
        console.log(chalk.yellow('No tables identified in the query.'));
        return;
      }
      
      console.log(chalk.green('Tables in query:'), chalk.yellow(mentionedTables.join(', ')));
      
      // Fetch detailed schema
      const fullSchema = await this.loadDetailedSchema();
      
      // Filter to only show tables mentioned in the query and their direct relationships
      const relevantTables = new Set(mentionedTables);
      const relationships = this.extractRelationships(fullSchema);
      
      // Add tables that are directly related to the mentioned tables
      for (const rel of relationships) {
        if (mentionedTables.includes(rel.fromTable.toLowerCase())) {
          relevantTables.add(rel.toTable.toLowerCase());
        }
        if (mentionedTables.includes(rel.toTable.toLowerCase())) {
          relevantTables.add(rel.fromTable.toLowerCase());
        }
      }
      
      const filteredSchema = fullSchema.filter(table => 
        relevantTables.has(table.tableName.toLowerCase())
      );
      
      const filteredRelationships = relationships.filter(rel =>
        relevantTables.has(rel.fromTable.toLowerCase()) && 
        relevantTables.has(rel.toTable.toLowerCase())
      );
      
      // Render the visualization
      console.log(chalk.cyan.bold('\n=== QUERY VISUALIZATION ===\n'));
      console.log(chalk.dim(query));
      console.log();
      
      this.renderSchemaVisual(filteredSchema, filteredRelationships);
      
      // Show a simplified ASCII visualization of the query
      this.renderQueryFlowDiagram(filteredSchema, filteredRelationships, mentionedTables);
      
    } catch (error) {
      console.error(chalk.red('Error visualizing query:'), error);
    }
  }
  
  /**
   * Render a simplified flow diagram of the query
   */
  private renderQueryFlowDiagram(
    _tables: TableSchema[], // Renamed with underscore to indicate it's not used
    relationships: TableRelationship[],
    mentionedTables: string[]
  ): void {
    console.log(chalk.cyan.bold('\n=== QUERY FLOW DIAGRAM ===\n'));
    
    // Create a map of relationships for easier lookup
    const tableRelationships = new Map<string, string[]>();
    
    for (const rel of relationships) {
      if (!tableRelationships.has(rel.fromTable.toLowerCase())) {
        tableRelationships.set(rel.fromTable.toLowerCase(), []);
      }
      tableRelationships.get(rel.fromTable.toLowerCase())!.push(
        `${rel.toTable} (${rel.fromColumn} → ${rel.toColumn})`
      );
    }
    
    // Render the diagram
    for (const tableName of mentionedTables) {
      const relatedTables = tableRelationships.get(tableName.toLowerCase()) || [];
      
      console.log(chalk.green.bold(tableName));
      
      if (relatedTables.length > 0) {
        for (const related of relatedTables) {
          console.log(`  ${chalk.dim('↓')} ${chalk.blue(related)}`);
        }
      } else {
        console.log(`  ${chalk.dim('(no direct relationships)')}`);
      }
      
      console.log();
    }
  }
}