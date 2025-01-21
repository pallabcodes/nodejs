// `process.on('message')` is specific to the **child process**.
// It listens for messages sent from the parent process (e.g., using `worker.send`).
process.on('message', async ({ dataSource, targetSource }) => {
  console.log('Worker started for migration task.');

  try {
    // Simulate the database migration task with the provided data sources
    // `performMigration` is an async function that mimics a heavy or long-running operation.
    await performMigration(dataSource, targetSource);

    // If the migration completes successfully, notify the parent process.
    // This uses `process.send`, which is how child processes communicate with the parent.
    process.send('done');
  } catch (error) {
    // If any error occurs during the migration, log the error for debugging.
    console.error('Error during migration:', error);

    // Notify the parent process about the failure so it can handle it appropriately.
    process.send('error');
  }
});

// A function that simulates performing the migration task.
// This function uses async/await to handle asynchronous operations gracefully.
async function performMigration(dataSource, targetSource) {
  // Log the details of the migration for traceability.
  console.log(`Migrating data from ${dataSource} to ${targetSource}...`);

  // Simulate the migration process taking 1 hour to complete.
  // `setTimeout` is wrapped in a Promise to mimic an actual asynchronous operation.
  await new Promise((resolve) => setTimeout(resolve, 3600 * 1000)); // 3600 seconds = 1 hour

  // Log a success message to indicate completion of the task.
  console.log('Migration completed.');
}
