import { Trie } from './trie';
import { loadSQLKeywords } from './schemaLoader';

export class SQLCompleter {
  private keywordsTrie: Trie;
  private tablesTrie: Trie;
  private columnsTrie: Trie;
  // @ts-expect-error type later
  private columnsByTable: Record<string, string[]>;
  
  constructor() {
    this.keywordsTrie = new Trie();
    this.tablesTrie = new Trie();
    this.columnsTrie = new Trie();
    this.columnsByTable = {};
    
    // Load SQL keywords
    this.loadKeywords();
  }
  
  private loadKeywords(): void {
    const keywords = loadSQLKeywords();
    for (const keyword of keywords) {
      this.keywordsTrie.insert(keyword);
    }
  }
  
  // Load schema information into tries
  loadSchema(schema: Record<string, string[]>): void {
    this.columnsByTable = schema;
    
    // Load tables into the tables trie
    for (const table of Object.keys(schema)) {
      this.tablesTrie.insert(table);
    }
    
    // Load all columns into the columns trie
    for (const columns of Object.values(schema)) {
      for (const column of columns) {
        this.columnsTrie.insert(column);
      }
    }
  }
  
  // Get completions for the current input
  getCompletions(inputText: string, cursorPos: number): string[] {
    const text = inputText.substring(0, cursorPos);
    const tokens = this.tokenizeSQL(text);
    const lastToken = tokens[tokens.length - 1] || '';
    
    // If we're in the middle of typing a word
    if (/\w+$/.test(lastToken)) {
      const prefix = lastToken.match(/\w+$/)?.[0] || '';
      
      // Context-aware completions
      if (this.isAfterFrom(tokens) || this.isAfterJoin(tokens)) {
        // After FROM or JOIN, suggest tables
        return this.tablesTrie.findAllWithPrefix(prefix);
      } else if (this.isAfterSelect(tokens) || this.isInWhereClause(tokens)) {
        // After SELECT or in WHERE clause, suggest both tables and columns
        const tableCompletions = this.tablesTrie.findAllWithPrefix(prefix);
        const columnCompletions = this.columnsTrie.findAllWithPrefix(prefix);
        return [...new Set([...tableCompletions, ...columnCompletions])];
      }
      
      // Default to keywords
      return this.keywordsTrie.findAllWithPrefix(prefix);
    }
    
    return [];
  }
  
  // Simple tokenizer
  private tokenizeSQL(sql: string): string[] {
    return sql
      .replace(/\n/g, ' ')
      .replace(/[();,]/g, ' $& ')
      .split(/\s+/)
      .filter(Boolean);
  }
  
  // Context detection helpers
  private isAfterFrom(tokens: string[]): boolean {
    for (let i = tokens.length - 2; i >= 0; i--) {
      if (tokens[i].toUpperCase() === 'FROM') return true;
      if (tokens[i] === ';') return false;
    }
    return false;
  }
  
  private isAfterJoin(tokens: string[]): boolean {
    for (let i = tokens.length - 2; i >= 0; i--) {
      const token = tokens[i].toUpperCase();
      if (['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'].includes(token)) return true;
      if (tokens[i] === ';') return false;
    }
    return false;
  }
  
  private isAfterSelect(tokens: string[]): boolean {
    for (let i = tokens.length - 2; i >= 0; i--) {
      if (tokens[i].toUpperCase() === 'SELECT') return true;
      if (['FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT'].includes(tokens[i].toUpperCase())) return false;
      if (tokens[i] === ';') return false;
    }
    return false;
  }
  
  private isInWhereClause(tokens: string[]): boolean {
    let inWhere = false;
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toUpperCase();
      if (token === 'WHERE') inWhere = true;
      if (['GROUP', 'ORDER', 'HAVING', 'LIMIT'].includes(token)) inWhere = false;
      if (token === ';') inWhere = false;
    }
    
    return inWhere;
  }
}
