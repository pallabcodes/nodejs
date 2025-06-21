import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'sql';

export interface ExportOptions {
  format: ExportFormat;
  filepath?: string;
  includeHeaders?: boolean;
  pretty?: boolean;
}

export class ResultExporter {
  /**
   * Export query results to a file or return as a string
   */
  export(
    fields: any[],
    rows: any[],
    options: ExportOptions
  ): Promise<string> {
    const formatter = this.getFormatter(options.format);
    const content = formatter(fields, rows, options);
    
    if (options.filepath) {
      return this.writeToFile(content, options.filepath);
    }
    
    return Promise.resolve(content);
  }

  /**
   * Write content to a file
   */
  private async writeToFile(content: string, filepath: string): Promise<string> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(filepath, content);
      return chalk.green(`Results exported to ${filepath}`);
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  /**
   * Get the appropriate formatter for the requested format
   */
  private getFormatter(format: ExportFormat): (fields: any[], rows: any[], options: ExportOptions) => string {
    switch (format) {
      case 'json': return this.formatAsJSON;
      case 'csv': return this.formatAsCSV;
      case 'markdown': return this.formatAsMarkdown;
      case 'sql': return this.formatAsSQL;
      default: return this.formatAsJSON;
    }
  }

  /**
   * Format as JSON
   */
  private formatAsJSON(fields: any[], rows: any[], options: ExportOptions): string {
    if (rows.length === 0) return '[]';
    
    // Convert rows to an array of objects
    const jsonRows = rows.map(row => {
      const obj: Record<string, any> = {};
      fields.forEach((field) => {
        obj[field.name] = row[field.name];
      });
      return obj;
    });
    
    return options.pretty
      ? JSON.stringify(jsonRows, null, 2)
      : JSON.stringify(jsonRows);
  }

  /**
   * Format as CSV
   */
  private formatAsCSV(fields: any[], rows: any[], options: ExportOptions): string {
    if (rows.length === 0) return '';
    
    const includeHeaders = options.includeHeaders !== false;
    const lines: string[] = [];
    
    // Add headers
    if (includeHeaders) {
      lines.push(fields.map(field => this.escapeCSV(field.name)).join(','));
    }
    
    // Add data rows
    rows.forEach(row => {
      const values = fields.map(field => this.escapeCSV(String(row[field.name] ?? '')));
      lines.push(values.join(','));
    });
    
    return lines.join('\n');
  }

  /**
   * Format as Markdown table
   */
  private formatAsMarkdown(fields: any[], rows: any[], _options: ExportOptions): string {
    if (rows.length === 0) return 'No data';
    
    const lines: string[] = [];
    
    // Add headers
    const headers = fields.map(field => field.name);
    lines.push(`| ${headers.join(' | ')} |`);
    
    // Add separator
    lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
    
    // Add data rows
    rows.forEach(row => {
      const values = fields.map(field => String(row[field.name] ?? ''));
      lines.push(`| ${values.join(' | ')} |`);
    });
    
    return lines.join('\n');
  }

  /**
   * Format as SQL INSERT statements
   */
  private formatAsSQL(fields: any[], rows: any[], options: ExportOptions): string {
    if (rows.length === 0) return '-- No data to export';
    
    // Use options.filepath if available for table name, otherwise use a default
    const tableName = options.filepath 
      ? path.basename(options.filepath, path.extname(options.filepath)) 
      : 'exported_data';
    
    const lines: string[] = [];
    
    // Add CREATE TABLE statement
    lines.push(`-- Generated SQL export`);
    lines.push(`-- Table: ${tableName}`);
    lines.push(`-- Date: ${new Date().toISOString()}`);
    lines.push('');
    
    // Add INSERT statements
    rows.forEach(row => {
      const columns = fields.map(field => field.name);
      const values = fields.map(field => this.formatSQLValue(row[field.name]));
      
      lines.push(
        `INSERT INTO ${tableName} (${columns.join(', ')}) ` +
        `VALUES (${values.join(', ')});`
      );
    });
    
    return lines.join('\n');
  }

  /**
   * Format a value for SQL
   */
  private formatSQLValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    
    // Escape single quotes and wrap in quotes
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  /**
   * Escape a value for CSV
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}