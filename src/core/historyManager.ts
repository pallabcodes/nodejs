import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

interface HistoryEntry {
  timestamp: number;
  query: string;
  database?: string;
  duration?: number;
  rowCount?: number;
}

export class HistoryManager {
  private historyPath: string;
  private maxEntries: number;
  private entries: HistoryEntry[] = [];
  private loaded = false;

  constructor(options?: { maxEntries?: number; historyPath?: string }) {
    this.maxEntries = options?.maxEntries || 1000;
    
    // Default history file location in user's home directory
    const defaultPath = path.join(os.homedir(), '.tq_history.json');
    this.historyPath = options?.historyPath || defaultPath;
    
    // Create directory if it doesn't exist
    const dir = path.dirname(this.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Load history from file (lazy-loaded)
  private load(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf8');
        this.entries = JSON.parse(data);
        // Sort entries by timestamp (newest first)
        this.entries.sort((a, b) => b.timestamp - a.timestamp);
        // Trim to max entries
        if (this.entries.length > this.maxEntries) {
          this.entries = this.entries.slice(0, this.maxEntries);
        }
      } else {
        // Initialize with empty array if file doesn't exist
        fs.writeFileSync(this.historyPath, JSON.stringify([]));
      }
      this.loaded = true;
    } catch (error) {
      console.error(chalk.red(`Error loading history: ${(error as Error).message}`));
      this.entries = [];
      this.loaded = true;
    }
  }

  // Save history to file
  private save(): void {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify(this.entries.slice(0, this.maxEntries)));
    } catch (error) {
      console.error(chalk.red(`Error saving history: ${(error as Error).message}`));
    }
  }

  // Add a query to history
  addEntry(query: string, details?: { database?: string; duration?: number; rowCount?: number }): void {
    if (!this.loaded) this.load();
    
    const entry: HistoryEntry = {
      timestamp: Date.now(),
      query,
      ...details
    };

    // Avoid duplicate adjacent entries (same query)
    if (this.entries.length > 0 && this.entries[0].query === query) {
      // Update timestamp and details of the existing entry
      this.entries[0].timestamp = entry.timestamp;
      if (details?.duration) this.entries[0].duration = details.duration;
      if (details?.rowCount) this.entries[0].rowCount = details.rowCount;
    } else {
      // Add new entry
      this.entries.unshift(entry);
    }

    // Trim if necessary and save
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    
    this.save();
  }

  // Get all history entries
  getEntries(limit?: number): HistoryEntry[] {
    if (!this.loaded) this.load();
    return limit ? this.entries.slice(0, limit) : [...this.entries];
  }

  // Search history
  search(term: string): HistoryEntry[] {
    if (!this.loaded) this.load();
    const lowerTerm = term.toLowerCase();
    return this.entries.filter(entry => 
      entry.query.toLowerCase().includes(lowerTerm)
    );
  }

  // Clear history
  clear(): void {
    this.entries = [];
    this.save();
  }

  // Get history for readline
  getReadlineHistory(): string[] {
    if (!this.loaded) this.load();
    return this.entries.map(entry => entry.query);
  }

  // Format entries for display
  formatEntries(entries: HistoryEntry[], options?: { showTimestamp?: boolean; showDuration?: boolean }): string[] {
    return entries.map((entry, index) => {
      const parts = [`${index + 1}.`];
      
      if (options?.showTimestamp) {
        const date = new Date(entry.timestamp);
        parts.push(chalk.gray(`[${date.toLocaleString()}]`));
      }
      
      parts.push(entry.query);
      
      if (options?.showDuration && entry.duration !== undefined) {
        parts.push(chalk.yellow(`(${entry.duration}ms)`));
      }
      
      return parts.join(' ');
    });
  }
}