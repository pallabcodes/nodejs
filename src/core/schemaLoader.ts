import { Client } from 'pg';
import { LRUCache } from './cache';
import { ContainerClient } from './docker/containerClient';
import { UniversalClient } from './connect';

// Cache schema information per database URL
const schemaCache = new LRUCache<string, Record<string, string[]>>(10, 5 * 60 * 1000); // 5 minutes TTL

export async function loadSchema(client: UniversalClient) {
  // Use connection details as cache key
  const cacheKey = client.connectionParameters?.database || 'default_db';
  
  // Check if schema is already in cache
  const cachedSchema = schemaCache.get(cacheKey);
  if (cachedSchema) {
    console.log('📋 Using cached schema');
    return cachedSchema;
  }
  
  console.log('🔍 Fetching fresh schema...');
  
  // Determine if this is a container client
  const isContainerClient = 'getContainerInfo' in client;
  
  let schema: Record<string, string[]> = {};
  
  if (isContainerClient) {
    schema = await loadContainerSchema(client as ContainerClient);
  } else {
    schema = await loadDirectSchema(client as Client);
  }
  
  // Cache the schema
  schemaCache.set(cacheKey, schema);
  return schema;
}

/**
 * Load schema directly from a PostgreSQL database
 */
async function loadDirectSchema(client: Client): Promise<Record<string, string[]>> {
  const tablesRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_type='BASE TABLE';
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  const schema: Record<string, string[]> = {};

  for (const table of tables) {
    const colsRes = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name='${table}'
    `);
    schema[table] = colsRes.rows.map(r => r.column_name);
  }

  return schema;
}

/**
 * Load schema from a containerized database
 */
async function loadContainerSchema(client: ContainerClient): Promise<Record<string, string[]>> {
  const schema: Record<string, string[]> = {};
  
  const container = client.getContainerInfo();
  const dbType = container.dbType;
  
  if (dbType === 'postgres') {
    // Get tables
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE';
    `);
    
    // Fix #1: Add type assertion to ensure table name is a string
    const tables = tablesResult.rows.map(row => String(Object.values(row)[0]));
    
    for (const table of tables) {
      // Get columns for each table
      const columnsResult = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='${table}'
      `);
      
      // Fix #1: Add type assertion for column names
      schema[table] = columnsResult.rows.map(row => String(Object.values(row)[0]));
    }
  } else if (dbType === 'mysql') {
    const database = client.connectionParameters.database;
    
    // Get tables
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='${database}';
    `);
    
    // Fix #2: Add type assertion to ensure table name is a string
    const tables = tablesResult.rows.map(row => String(Object.values(row)[0]));
    
    for (const table of tables) {
      // Get columns for each table
      const columnsResult = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema='${database}' AND table_name='${table}';
      `);
      
      // Fix #2: Add type assertion for column names
      schema[table] = columnsResult.rows.map(row => String(Object.values(row)[0]));
    }
  }
  
  return schema;
}

// Load SQL keywords into a trie for autocomplete
export function loadSQLKeywords() {
  return [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE',
    'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'AS',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL',
    'COUNT', 'AVG', 'SUM', 'MIN', 'MAX', 'DISTINCT'
  ];
}
