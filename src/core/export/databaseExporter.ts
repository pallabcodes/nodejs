import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface DatabaseExportOptions {
  tables?: string[]; // Specific tables to export
  filepath: string; // Path to save the dump file
  schemaOnly?: boolean; // Export schema only (no data)
}

export class DatabaseExporter {
  private dbName: string;
  private dbUser: string;
  private dbPassword: string;
  private dbHost: string;

  constructor(dbName: string, dbUser: string, dbPassword: string, dbHost: string = 'localhost') {
    this.dbName = dbName;
    this.dbUser = dbUser;
    this.dbPassword = dbPassword;
    this.dbHost = dbHost;
  }

  /**
   * Export the database or specific tables
   */
  async exportDatabase(options: DatabaseExportOptions): Promise<void> {
    const tables = options.tables?.join(' ') || '';
    const schemaFlag = options.schemaOnly ? '--no-data' : '';
    const filepath = path.resolve(options.filepath);

    const command = `mysqldump -h ${this.dbHost} -u ${this.dbUser} -p${this.dbPassword} ${schemaFlag} ${this.dbName} ${tables} > ${filepath}`;

    try {
      console.log(chalk.cyan(`Exporting database ${this.dbName}...`));
      await this.executeCommand(command);
      console.log(chalk.green(`Database exported successfully to ${filepath}`));
    } catch (error) {
      console.error(chalk.red(`Export failed: ${(error as Error).message}`));
    }
  }

  /**
   * Execute shell commands
   */
  private async executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve();
      });
    });
  }
}