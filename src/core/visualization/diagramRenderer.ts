import chalk from 'chalk';
import { SQLParser, TableReference, TableRelationship } from './sqlParser';

export class DiagramRenderer {
    private parser: SQLParser;

    constructor() {
        this.parser = new SQLParser();
    }

    renderRelationshipDiagram(query: string, schema: any): string {
        try {
            // Parse the query using our SQLParser
            const { tables, relationships } = this.parser.parseQuery(query);

            if (tables.length === 0) {
                return chalk.yellow('No tables found in the query.');
            }

            // Build the visualization
            let output = '\n';
            output += chalk.cyan('📊 Query Visualization\n');
            output += chalk.dim('─'.repeat(50) + '\n\n');

            // Show Tables
            output += chalk.green('Tables Involved:\n');
            tables.forEach(table => {
                output += `${chalk.cyan('├─')} ${table}\n`;
                if (schema[table]) {
                    schema[table].forEach((column: string) => {
                        output += `${chalk.dim('│  └─')} ${column}\n`;
                    });
                }
            });

            // Show Relationships
            if (relationships.length > 0) {
                output += `\n${chalk.green('Relationships:')}\n`;
                relationships.forEach(rel => {
                    output += `${chalk.cyan('├─')} ${rel.sourceTable}.${rel.sourceColumn}`;
                    output += ` ${chalk.yellow(rel.joinType)} `;
                    output += `${rel.targetTable}.${rel.targetColumn}\n`;
                });
            }

            // Add Query Stats
            output += `\n${chalk.cyan('Query Stats:')}\n`;
            output += `${chalk.dim('├─')} Tables: ${tables.length}\n`;
            output += `${chalk.dim('└─')} Joins: ${relationships.length}\n`;

            return output;

        } catch (error) {
            throw new Error(`Failed to render diagram: ${error.message}`);
        }
    }
}