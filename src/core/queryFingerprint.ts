import crypto from 'crypto';

export class QueryFingerprinter {
  /**
   * Generate a fingerprint for a SQL query by normalizing it
   * @param sql SQL query to fingerprint
   * @returns Object containing fingerprint, normalized query, and complexity score
   */
  static fingerprint(sql: string): QueryFingerprint {
    // Normalize the query
    const normalized = this.normalizeQuery(sql);
    
    // Generate hash for the normalized query
    const hash = crypto
      .createHash('md5')
      .update(normalized)
      .digest('hex')
      .substring(0, 10);
    
    // Calculate complexity metrics
    const complexity = this.calculateComplexity(sql);
    
    return {
      hash,
      normalized,
      complexity,
      originalLength: sql.length
    };
  }

  /**
   * Normalize a SQL query by replacing literals with placeholders
   */
  private static normalizeQuery(sql: string): string {
    let normalized = sql;
    
    // Replace comments
    normalized = normalized.replace(/--.*$/mg, '');
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Replace quoted strings with placeholders
    normalized = normalized.replace(/'([^'\\]|\\.)*'/g, "'?'");
    normalized = normalized.replace(/"([^"\\]|\\.)*"/g, '"?"');
    
    // Replace numeric literals
    normalized = normalized.replace(/\b\d+\b/g, '?');
    
    // Replace boolean literals
    normalized = normalized.replace(/\btrue\b|\bfalse\b/gi, '?');
    
    // Replace UUIDs
    normalized = normalized.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 
      '?'
    );
    
    // Replace multi-spaces with single space
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Trim
    normalized = normalized.trim();
    
    return normalized;
  }

  /**
   * Calculate the complexity of a SQL query
   */
  private static calculateComplexity(sql: string): QueryComplexity {
    const lowerSql = sql.toLowerCase();
    
    const hasJoin = /\bjoin\b/i.test(lowerSql);
    const joinCount = (lowerSql.match(/\bjoin\b/gi) || []).length;
    const hasGroupBy = /\bgroup\s+by\b/i.test(lowerSql);
    const hasOrderBy = /\border\s+by\b/i.test(lowerSql);
    const hasSubquery = /\(\s*select\b/i.test(lowerSql);
    const subqueryCount = (lowerSql.match(/\(\s*select\b/gi) || []).length;
    const hasAggregate = /\b(count|sum|avg|min|max)\s*\(/i.test(lowerSql);
    const hasLimit = /\blimit\b/i.test(lowerSql);
    const selectFromCount = (lowerSql.match(/\bfrom\b/gi) || []).length;
    
    // Calculate an overall complexity score (0-100)
    let complexityScore = 0;
    
    // Base score based on query type
    if (lowerSql.startsWith('select')) complexityScore += 10;
    if (lowerSql.startsWith('insert')) complexityScore += 15;
    if (lowerSql.startsWith('update')) complexityScore += 15;
    if (lowerSql.startsWith('delete')) complexityScore += 15;
    
    // Add complexity for joins
    complexityScore += joinCount * 10;
    
    // Add complexity for subqueries
    complexityScore += subqueryCount * 15;
    
    // Additional complexity factors
    if (hasGroupBy) complexityScore += 10;
    if (hasAggregate) complexityScore += 8;
    if (hasOrderBy) complexityScore += 5;
    if (!hasLimit) complexityScore += 5;  // Not having a LIMIT can make queries more expensive
    if (selectFromCount > 1) complexityScore += (selectFromCount - 1) * 10;  // Multiple FROM clauses
    
    // Cap at 100
    complexityScore = Math.min(complexityScore, 100);
    
    return {
      score: complexityScore,
      hasJoin,
      joinCount,
      hasSubquery,
      subqueryCount,
      hasGroupBy,
      hasOrderBy,
      hasAggregate,
      hasLimit
    };
  }

  /**
   * Calculate how similar two queries are (0-100%)
   */
  static similarity(query1: string, query2: string): number {
    const fingerprint1 = this.fingerprint(query1);
    const fingerprint2 = this.fingerprint(query2);
    
    // If fingerprints match exactly, they're identical
    if (fingerprint1.hash === fingerprint2.hash) {
      return 100;
    }
    
    // If normalized form matches, they're very similar
    if (fingerprint1.normalized === fingerprint2.normalized) {
      return 95;
    }
    
    // Calculate Levenshtein distance between normalized queries
    const distance = this.levenshteinDistance(
      fingerprint1.normalized,
      fingerprint2.normalized
    );
    
    // Convert to a similarity percentage
    const maxLength = Math.max(
      fingerprint1.normalized.length,
      fingerprint2.normalized.length
    );
    
    if (maxLength === 0) return 100;  // Both empty strings
    
    const similarity = Math.max(0, 100 - (distance / maxLength * 100));
    return Math.round(similarity);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Create a matrix of size (m+1) x (n+1)
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize the matrix
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return dp[m][n];
  }
}

export interface QueryFingerprint {
  hash: string;
  normalized: string;
  complexity: QueryComplexity;
  originalLength: number;
}

export interface QueryComplexity {
  score: number;
  hasJoin: boolean;
  joinCount: number;
  hasSubquery: boolean;
  subqueryCount: number;
  hasGroupBy: boolean;
  hasOrderBy: boolean;
  hasAggregate: boolean;
  hasLimit: boolean;
}