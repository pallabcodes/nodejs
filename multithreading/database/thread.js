// Import the `parentPort` and `workerData` from the `worker_threads` module.
// `parentPort` allows communication with the parent thread.
// `workerData` contains data passed from the parent thread when the worker is created.
const { parentPort, workerData } = require('worker_threads');

// Extract the data passed from the parent thread.
const { dataSource, targetSource } = workerData;

// Immediately start the migration task when the worker thread is initialized.
(async () => {
  console.log('Worker thread initialized for migration task.');

  try {
    // Perform the migration task using the provided data.
    await performMigration(dataSource, targetSource);

    // Notify the parent thread that the task is complete by sending a message.
    parentPort.postMessage('done');
  } catch (error) {
    // Log any errors that occur during migration.
    console.error('Error during migration:', error);

    // Notify the parent thread about the failure.
    parentPort.postMessage('error');
  }
})();

// Function to simulate performing the migration task.
// This simulates a long-running operation such as database migration.
async function performMigration(dataSource, targetSource) {
  console.log(`Migrating data from ${dataSource} to ${targetSource}...`);

  // Simulate the time-consuming operation by introducing a 1-hour delay.
  await new Promise((resolve) => setTimeout(resolve, 3600 * 1000)); // 1 hour

  console.log('Migration completed successfully.');
}
