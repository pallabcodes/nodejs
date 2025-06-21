import { Client } from 'pg';
import { PerformanceTracker } from './performanceTracker';
import { UniversalClient } from './connect';
import { ContainerClient } from './docker/containerClient';

interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: any[];
  duration: number;
  queryFingerprint?: string;
  performance?: any;
}

export async function runQuery(client: UniversalClient, sql: string, options?: { trackPerformance?: boolean }): Promise<QueryResult> {
  const shouldTrackPerformance = options?.trackPerformance !== false;
  const start = Date.now();
  
  // Determine if this is a container client
  const isContainerClient = 'getContainerInfo' in client;
  
  // Run the query on appropriate client type
  const result = isContainerClient 
    ? await (client as ContainerClient).query(sql)
    : await (client as Client).query(sql);
  
  const duration = Date.now() - start;

  const queryResult: QueryResult = {
    rows: result.rows,
    // @ts-expect-error type mismatch, but we handle it
    rowCount: result.rowCount,
    fields: result.fields,
    duration
  };

  // Track performance if enabled
  if (shouldTrackPerformance) {
    const tracker = new PerformanceTracker();
    const dbName = client.connectionParameters?.database || 'unknown';
    
    const pattern = tracker.trackQuery(
      sql,
      duration,
      result.rowCount || 0,
      dbName
    );
    
    queryResult.queryFingerprint = pattern.fingerprint.hash;
    queryResult.performance = {
      pattern,
      trend: pattern.trend,
      avgDuration: pattern.avgDuration,
      complexity: pattern.fingerprint.complexity
    };
  }

  return queryResult;
}
