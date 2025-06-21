import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Render query results as a formatted table
 */
export function renderTable(fields: any[], rows: any[]): void {
  if (!rows || rows.length === 0) {
    console.log(chalk.yellow('No rows returned'));
    return;
  }

  // Extract column names from fields
  const columns = fields.map(field => field.name);
  
  // Create a beautiful table with cli-table3
  const table = new Table({
    head: columns.map(col => chalk.cyan.bold(col)),
    style: {
      head: [],  // We're using chalk directly on header text
      border: [] // No additional styling for border
    },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  // Add rows to the table with formatting
  rows.forEach((row, index) => {
    const rowData = columns.map(col => {
      const value = row[col];
      
      // Format based on data type
      if (value === null || value === undefined) {
        return chalk.dim('NULL');
      } else if (typeof value === 'object') {
        const json = JSON.stringify(value);
        return chalk.magenta(json.length > 30 ? json.substring(0, 27) + '...' : json);
      } else if (typeof value === 'number') {
        return chalk.yellow(value.toString());
      } else if (value.toString().length > 40) {
        return value.toString().substring(0, 37) + '...';
      }
      return value.toString();
    });
    
    table.push(rowData);
  });

  // Display the table
  console.log(table.toString());
  
  // Show summary
  console.log(chalk.green(`✓ ${rows.length} rows returned`));
}
