/**
 * Summarize the results of a query
 */
export async function summarizeResults(rows: any[], fields: any[]): Promise<void> {
  console.log(chalk.cyan('📊 Data Summary:'));
  console.log(`Total rows: ${rows.length}`);
  
  if (rows.length === 0) return;
  
  // Summarize each column
  for (const field of fields) {
    const colName = field.name;
    const values = rows.map(r => r[colName]);
    const nonNull = values.filter(v => v !== null && v !== undefined).length;
    
    console.log(chalk.bold(`\n${colName}:`));
    console.log(`  Type: ${getColumnType(values)}`);
    console.log(`  Non-null: ${nonNull} (${Math.round(nonNull/rows.length * 100)}%)`);
    
    // Numeric column analysis
    if (values.every(v => v === null || v === undefined || !isNaN(Number(v)))) {
      const numbers = values.filter(v => v !== null && v !== undefined).map(Number);
      if (numbers.length > 0) {
        console.log(`  Min: ${Math.min(...numbers)}`);
        console.log(`  Max: ${Math.max(...numbers)}`);
        console.log(`  Avg: ${numbers.reduce((a, b) => a + b, 0) / numbers.length}`);
      }
    }
    
    // String column analysis
    if (values.every(v => v === null || v === undefined || typeof v === 'string')) {
      const strings = values.filter(v => v !== null && v !== undefined && typeof v === 'string');
      if (strings.length > 0) {
        const minLength = Math.min(...strings.map(s => s.length));
        const maxLength = Math.max(...strings.map(s => s.length));
        console.log(`  Min length: ${minLength}`);
        console.log(`  Max length: ${maxLength}`);
        console.log(`  Avg length: ${strings.reduce((a, b) => a + b.length, 0) / strings.length}`);
      }
    }
    
    // Date column analysis
    if (isDateColumn(values)) {
      const dates = values
        .filter(v => v !== null && v !== undefined)
        .map(v => new Date(v))
        .filter(d => !isNaN(d.getTime()));
      
      if (dates.length > 0) {
        console.log(`  Earliest: ${new Date(Math.min(...dates.map(d => d.getTime()))).toISOString()}`);
        console.log(`  Latest: ${new Date(Math.max(...dates.map(d => d.getTime()))).toISOString()}`);
        console.log(`  Range: ${Math.ceil((Math.max(...dates.map(d => d.getTime())) - 
                             Math.min(...dates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24))} days`);
      }
    }
  }
}