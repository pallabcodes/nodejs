import chalk from 'chalk';
import { TableReference } from './sqlParser';

export function renderRelationshipDiagram(tables: TableReference[], relationships: any[]) {
  // Header
  console.log(chalk.blue('\n┌─────────────────────────────────┐'));
  console.log(chalk.blue('│        QUERY VISUALIZATION       │'));
  console.log(chalk.blue('└─────────────────────────────────┘\n'));

  // Tables
  console.log(chalk.green('Tables:'));
  tables.forEach(table => {
    const alias = table.alias ? ` (${chalk.yellow(table.alias)})` : '';
    console.log(`  ${chalk.cyan(table.table)}${alias}`);
  });
  
  // Relationships
  if (relationships.length > 0) {
    console.log(chalk.green('\nRelationships:'));
    relationships.forEach(rel => {
      const fromTable = rel.fromTable;
      const toTable = rel.toTable;
      const joinType = rel.type || 'JOIN';
      
      console.log(`  ${chalk.cyan(fromTable)}.${chalk.yellow(rel.fromColumn)} ${joinType} ${chalk.cyan(toTable)}.${chalk.yellow(rel.toColumn)}`);
    });
  }
  
  console.log(); // Add some spacing
}