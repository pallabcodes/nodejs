import { exec } from 'child_process';
import path from 'path';
import chalk from 'chalk';

export interface DatabaseImportOptions {
  filepath: string; // Path to the SQL dump file
}

export class DatabaseImporter {
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
   * Import the database from a dump file
   */
  async importDatabase(options: DatabaseImportOptions): Promise<void> {
    const filepath = path.resolve(options.filepath);

    const command = `mysql -h ${this.dbHost} -u ${this.dbUser} -p${this.dbPassword} ${this.dbName} < ${filepath}`;

    try {
      console.log(chalk.cyan(`Importing database ${this.dbName} from ${filepath}...`));
      await this.executeCommand(command);
      console.log(chalk.green(`Database imported successfully from ${filepath}`));
    } catch (error) {
      console.error(chalk.red(`Import failed: ${(error as Error).message}`));
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