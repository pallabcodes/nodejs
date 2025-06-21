import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { QueryFingerprinter, QueryFingerprint } from './queryFingerprint';

interface PerformanceRecord {
  timestamp: number;
  duration: number;
  rowCount: number;
  originalQuery: string;
  database: string;
}

interface QueryPattern {
  fingerprint: QueryFingerprint;
  executions: PerformanceRecord[];
  lastExecuted: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalExecutions: number;
  trend: 'improving' | 'stable' | 'degrading' | 'unknown';
}

export class PerformanceTracker {
  private storePath: string;
  private patterns: Map<string, QueryPattern>;
  private loaded: boolean = false;
  
  constructor() {
    // Store performance data in user's home directory
    this.storePath = path.join(os.homedir(), '.tq_performance.json');
    this.patterns = new Map();
  }
  
  /**
   * Track a query execution
   */
  trackQuery(
    sql: string, 
    duration: number, 
    rowCount: number, 
    database: string
  ): QueryPattern {
    if (!this.loaded) this.load();
    
    // Generate fingerprint
    const fingerprint = QueryFingerprinter.fingerprint(sql);
    const hash = fingerprint.hash;
    
    // Create record
    const record: PerformanceRecord = {
      timestamp: Date.now(),
      duration,
      rowCount,
      originalQuery: sql,
      database
    };
    
    // Get or create pattern
    let pattern = this.patterns.get(hash);
    
    if (!pattern) {
      pattern = {
        fingerprint,
        executions: [],
        lastExecuted: record.timestamp,
        avgDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        totalExecutions: 0,
        trend: 'unknown'
      };
      this.patterns.set(hash, pattern);
    }
    
    // Update pattern statistics
    pattern.executions.push(record);
    pattern.lastExecuted = record.timestamp;
    pattern.totalExecutions++;
    
    // Keep only the last 20 executions
    if (pattern.executions.length > 20) {
      pattern.executions = pattern.executions.slice(-20);
    }
    
    // Update min/max/avg
    pattern.minDuration = Math.min(pattern.minDuration, duration);
    pattern.maxDuration = Math.max(pattern.maxDuration, duration);
    pattern.avgDuration = pattern.executions.reduce(
      (sum, rec) => sum + rec.duration, 0
    ) / pattern.executions.length;
    
    // Calculate trend
    pattern.trend = this.calculateTrend(pattern);
    
    // Save data
    this.save();
    
    return pattern;
  }
  
  /**
   * Get all tracked patterns
   */
  getAllPatterns(): QueryPattern[] {
    if (!this.loaded) this.load();
    return Array.from(this.patterns.values());
  }
  
  /**
   * Get slow query patterns (with execution time > threshold ms)
   */
  getSlowPatterns(thresholdMs: number = 500): QueryPattern[] {
    if (!this.loaded) this.load();
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.avgDuration > thresholdMs)
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }
  
  /**
   * Get most frequently executed patterns
   */
  getMostFrequentPatterns(limit: number = 10): QueryPattern[] {
    if (!this.loaded) this.load();
    return Array.from(this.patterns.values())
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, limit);
  }
  
  /**
   * Get similar queries to the given query
   */
  getSimilarQueries(sql: string, similarityThreshold: number = 70): Array<{pattern: QueryPattern, similarity: number}> {
    if (!this.loaded) this.load();
    
    const results: Array<{pattern: QueryPattern, similarity: number}> = [];
    
    for (const pattern of this.patterns.values()) {
      const similarity = QueryFingerprinter.similarity(sql, pattern.executions[0].originalQuery);
      
      if (similarity >= similarityThreshold) {
        results.push({ pattern, similarity });
      }
    }
    
    // Sort by similarity (most similar first)
    return results.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Find the pattern for a specific query
   */
  findPatternForQuery(sql: string): QueryPattern | undefined {
    if (!this.loaded) this.load();
    
    const fingerprint = QueryFingerprinter.fingerprint(sql);
    return this.patterns.get(fingerprint.hash);
  }
  
  /**
   * Calculate performance trend
   */
  private calculateTrend(pattern: QueryPattern): 'improving' | 'stable' | 'degrading' | 'unknown' {
    if (pattern.executions.length < 3) return 'unknown';
    
    // Get the last 3 executions
    const recent = pattern.executions.slice(-3);
    
    // If all 3 are getting slower
    if (recent[0].duration < recent[1].duration && recent[1].duration < recent[2].duration) {
      return 'degrading';
    }
    
    // If all 3 are getting faster
    if (recent[0].duration > recent[1].duration && recent[1].duration > recent[2].duration) {
      return 'improving';
    }
    
    // Calculate variance
    const avg = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    const variance = recent.reduce((sum, r) => sum + Math.pow(r.duration - avg, 2), 0) / recent.length;
    
    // If variance is less than 10% of the average, consider it stable
    if (Math.sqrt(variance) < avg * 0.1) {
      return 'stable';
    }
    
    return 'unknown';
  }
  
  /**
   * Format pattern for console display
   */
  formatPattern(pattern: QueryPattern, options?: { showQuery?: boolean }): string {
    const trendColors = {
      improving: chalk.green('↓'),
      stable: chalk.blue('→'),
      degrading: chalk.red('↑'),
      unknown: chalk.gray('?')
    };
    
    const complexityScore = pattern.fingerprint.complexity.score;
    let complexityColor = chalk.green;
    if (complexityScore > 30) complexityColor = chalk.yellow;
    if (complexityScore > 60) complexityColor = chalk.red;
    
    const lines = [
      `${chalk.cyan(pattern.fingerprint.hash)} ${trendColors[pattern.trend]} ` +
      `Avg: ${this.formatDuration(pattern.avgDuration)} ` +
      `(${pattern.minDuration}-${pattern.maxDuration}ms) ` +
      `Runs: ${pattern.totalExecutions} ` +
      `Complexity: ${complexityColor(pattern.fingerprint.complexity.score)}`
    ];
    
    if (options?.showQuery) {
      lines.push(chalk.gray(`  ${pattern.fingerprint.normalized}`));
      
      const latestQuery = pattern.executions[pattern.executions.length - 1].originalQuery;
      lines.push(chalk.white(`  Example: ${latestQuery.substring(0, 80)}${latestQuery.length > 80 ? '...' : ''}`));
      
      // Add complexity details if high complexity
      if (complexityScore > 30) {
        const complexity = pattern.fingerprint.complexity;
        const warnings = [];
        
        if (complexity.joinCount > 2) warnings.push(`${complexity.joinCount} joins`);
        if (complexity.subqueryCount > 0) warnings.push(`${complexity.subqueryCount} subqueries`);
        if (complexity.hasGroupBy) warnings.push('group by');
        if (!complexity.hasLimit) warnings.push('no limit');
        
        if (warnings.length > 0) {
          lines.push(chalk.yellow(`  Complexity factors: ${warnings.join(', ')}`));
        }
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format duration with color coding
   */
  private formatDuration(ms: number): string {
    if (ms < 100) return chalk.green(`${ms}ms`);
    if (ms < 500) return chalk.yellow(`${ms}ms`);
    return chalk.red(`${ms}ms`);
  }
  
  /**
   * Clear all performance data
   */
  clear(): void {
    this.patterns = new Map();
    this.save();
  }
  
  /**
   * Load performance data from disk
   */
  private load(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
        
        for (const patternData of data) {
          this.patterns.set(patternData.fingerprint.hash, patternData);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error loading performance data: ${(error as Error).message}`));
      this.patterns = new Map();
    }
    
    this.loaded = true;
  }
  
  /**
   * Save performance data to disk
   */
  private save(): void {
    try {
      fs.writeFileSync(
        this.storePath,
        JSON.stringify(Array.from(this.patterns.values()))
      );
    } catch (error) {
      console.error(chalk.red(`Error saving performance data: ${(error as Error).message}`));
    }
  }
}