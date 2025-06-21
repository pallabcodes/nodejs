import { Parser } from 'node-sql-parser';

export interface TableRelationship {
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
}

export interface TableReference {
  table: string;
  alias?: string;
}

export class SQLParser {
  /**
   * Extract table relationships from a SQL query
   */
  parseRelationships(query: string): TableRelationship[] {
    // Extract JOIN conditions
    const joinPattern = /(\w+)\s+(?:LEFT|RIGHT|INNER|OUTER)?\s*JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
    const relationships: TableRelationship[] = [];
    
    let match;
    while ((match = joinPattern.exec(query)) !== null) {
        relationships.push({
            sourceTable: match[1],
            targetTable: match[2],
            sourceColumn: match[4],
            targetColumn: match[6],
            joinType: 'LEFT JOIN'
        });
    }
    
    return relationships;
  }

  parseQuery(query: string): {
    tables: string[];
    relationships: TableRelationship[];
  } {
    // Remove quotes and normalize query
    query = query.replace(/["']/g, '').replace(/\s+/g, ' ').trim();

    const tables: string[] = [];
    const relationships: TableRelationship[] = [];

    // Extract table name from simple SELECT
    const simpleSelectMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    if (simpleSelectMatch) {
        tables.push(simpleSelectMatch[1]);
    }

    // Extract table from complex queries with FROM clause
    const fromMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)?/i);
    if (fromMatch && !tables.includes(fromMatch[1])) {
        tables.push(fromMatch[1]);
    }

    // Extract JOIN relationships
    const joinRegex = /(?:LEFT|RIGHT|INNER|OUTER)?\s*JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s+ON\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/gi;
        
    let joinMatch;
    while ((joinMatch = joinRegex.exec(query)) !== null) {
        const [, tableName, , leftTable, leftCol, rightTable, rightCol] = joinMatch;
        
        if (!tables.includes(tableName)) {
            tables.push(tableName);
        }

        relationships.push({
            sourceTable: leftTable,
            targetTable: rightTable,
            sourceColumn: leftCol,
            targetColumn: rightCol,
            joinType: 'LEFT JOIN'
        });
    }

    return { tables, relationships };
  }
}

export class SQLRelationshipExtractor {
  private parser: Parser;

  constructor() {
    // Initialize the parser with PostgreSQL dialect
    this.parser = new Parser();
  }

  /**
   * Extract table relationships from a SQL query
   */
  extractRelationships(sql: string): TableRelationship[] {
    try {
      // Parse the SQL query
      const { ast } = this.parser.parse(sql, { database: 'postgresql' });
      
      // Handle both single AST and array of ASTs
      const astNode = Array.isArray(ast) ? ast[0] : ast;

      // We're only interested in SELECT statements
      if (!astNode || astNode.type !== 'select') {
        return [];
      }

      const relationships: TableRelationship[] = [];
      const tableAliases = new Map<string, string>();

      // Extract table references and their aliases
      if (astNode.from) {
        // Handle from as an array or single item
        const fromItems = Array.isArray(astNode.from) ? astNode.from : [astNode.from];
        
        for (const fromItem of fromItems) {
          // Type guard to check if the object has the shape we need
          const hasTable = 'table' in fromItem && typeof fromItem.table === 'string';
          const hasAlias = 'as' in fromItem && typeof fromItem.as === 'string';
          
          if (hasTable) {
            tableAliases.set(hasAlias ? fromItem.as as string : fromItem.table as string, fromItem.table as string);
          }
          
          // Process JOINs
          if ('join' in fromItem && Array.isArray(fromItem.join)) {
            for (const joinItem of fromItem.join) {
              const joinHasTable = 'table' in joinItem && typeof joinItem.table === 'string';
              const joinHasAlias = 'as' in joinItem && typeof joinItem.as === 'string';
              
              if (joinHasTable) {
                tableAliases.set(
                  joinHasAlias ? joinItem.as as string : joinItem.table as string, 
                  joinItem.table as string
                );
              }
              
              // Extract join conditions
              if ('on' in joinItem && joinItem.on) {
                const joinRelationships = this.extractJoinConditions(
                  joinItem.on,
                  tableAliases,
                  joinItem.type as string || 'INNER'
                );
                relationships.push(...joinRelationships);
              }
            }
          }
        }
      }

      // Extract relationships from WHERE conditions
      if (astNode.where) {
        const whereRelationships = this.extractWhereConditions(astNode.where, tableAliases);
        relationships.push(...whereRelationships);
      }

      return relationships;
    } catch (error) {
      console.error(`Error parsing SQL: ${error}`);
      return [];
    }
  }

  /**
   * Extract table references from the query
   */
  extractTableReferences(sql: string): TableReference[] {
    try {
      // Parse the SQL query
      const { ast } = this.parser.parse(sql, { database: 'postgresql' });
      
      // Handle both single AST and array of ASTs
      const astNode = Array.isArray(ast) ? ast[0] : ast;

      if (!astNode || astNode.type !== 'select' || !astNode.from) {
        return [];
      }

      const tables: TableReference[] = [];

      // Handle from as an array or single item
      const fromItems = Array.isArray(astNode.from) ? astNode.from : [astNode.from];
      
      // Process main FROM tables
      for (const fromItem of fromItems) {
        // Type guard to check if the object has the shape we need
        const hasTable = 'table' in fromItem && typeof fromItem.table === 'string';
        const hasAlias = 'as' in fromItem && typeof fromItem.as === 'string';
        
        if (hasTable) {
          tables.push({
            table: fromItem.table as string,
            alias: hasAlias ? fromItem.as as string : undefined
          });
        }
        
        // Process JOINs
        if ('join' in fromItem && Array.isArray(fromItem.join)) {
          for (const joinItem of fromItem.join) {
            const joinHasTable = 'table' in joinItem && typeof joinItem.table === 'string';
            const joinHasAlias = 'as' in joinItem && typeof joinItem.as === 'string';
            
            if (joinHasTable) {
              tables.push({
                table: joinItem.table as string,
                alias: joinHasAlias ? joinItem.as as string : undefined
              });
            }
          }
        }
      }

      return tables;
    } catch (error) {
      console.error(`Error extracting table references: ${error}`);
      return [];
    }
  }

  /**
   * Extract join conditions from the ON clause
   */
  private extractJoinConditions(
    onCondition: any,
    tableAliases: Map<string, string>,
    joinType: string
  ): TableRelationship[] {
    const relationships: TableRelationship[] = [];

    if (onCondition.type === 'binary_expr' && onCondition.operator === '=') {
      // This might be a join condition between two columns
      const left = onCondition.left;
      const right = onCondition.right;

      if (left.type === 'column_ref' && right.type === 'column_ref') {
        const sourceTable = left.table;
        const targetTable = right.table;
        const sourceColumn = left.column;
        const targetColumn = right.column;

        // Make sure both sides have table references
        if (sourceTable && targetTable) {
          relationships.push({
            sourceTable: tableAliases.get(sourceTable) || sourceTable,
            targetTable: tableAliases.get(targetTable) || targetTable,
            sourceColumn,
            targetColumn,
            joinType: joinType as TableRelationship['joinType']
          });
        }
      }
    } else if (onCondition.type === 'binary_expr' && 
              (onCondition.operator === 'AND' || onCondition.operator === 'OR')) {
      // Recursively process complex conditions
      relationships.push(
        ...this.extractJoinConditions(onCondition.left, tableAliases, joinType),
        ...this.extractJoinConditions(onCondition.right, tableAliases, joinType)
      );
    }

    return relationships;
  }

  /**
   * Extract relationships from WHERE conditions
   */
  private extractWhereConditions(
    whereCondition: any,
    tableAliases: Map<string, string>
  ): TableRelationship[] {
    const relationships: TableRelationship[] = [];

    if (whereCondition.type === 'binary_expr' && whereCondition.operator === '=') {
      // This might be a relationship condition
      const left = whereCondition.left;
      const right = whereCondition.right;

      if (left.type === 'column_ref' && right.type === 'column_ref') {
        const sourceTable = left.table;
        const targetTable = right.table;
        const sourceColumn = left.column;
        const targetColumn = right.column;

        // Make sure both sides have table references
        if (sourceTable && targetTable) {
          relationships.push({
            sourceTable: tableAliases.get(sourceTable) || sourceTable,
            targetTable: tableAliases.get(targetTable) || targetTable,
            sourceColumn,
            targetColumn,
            joinType: 'INNER' // Implicit joins in WHERE are INNER joins
          });
        }
      }
    } else if (whereCondition.type === 'binary_expr' && 
              (whereCondition.operator === 'AND' || whereCondition.operator === 'OR')) {
      // Recursively process complex conditions
      relationships.push(
        ...this.extractWhereConditions(whereCondition.left, tableAliases),
        ...this.extractWhereConditions(whereCondition.right, tableAliases)
      );
    }

    return relationships;
  }
}