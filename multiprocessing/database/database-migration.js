// Import the `fork` method from the `child_process` module.
// This allows the parent process to create child processes for executing tasks in parallel.
const { fork } = require("child_process");

// Function to start the migration task
function startMigrationTask(dataSource, targetSource) {
  // Use `fork` to create a new child process running the specified worker file (worker.js).
  // This creates a separate execution environment for the migration task.
  const worker = fork('./worker.js');

  // Send a message to the child process with the data needed for the migration.
  // `worker.send` transmits an object containing `dataSource` and `targetSource` to the child process.
  worker.send({ dataSource, targetSource });

  // Listen for messages sent by the child process using `process.send`.
  worker.on('message', (message) => {
    console.log(`Worker Message: ${message}`);

    // Check if the child process sends a 'done' message, indicating task completion.
    if (message === 'done') {
      console.log('Migration complete. Closing worker.');
      // Terminate the worker process once the task is finished.
      worker.kill(); // Frees up resources associated with the worker process.
    }
  });

  // Handle errors that may occur in the child process.
  worker.on('error', (error) => {
    // Log any errors for debugging purposes.
    console.error('Worker encountered an error:', error);
  });

  // Listen for the `exit` event, which is triggered when the child process terminates.
  worker.on('exit', (code) => {
    // Log the exit code of the child process for tracking or debugging.
    console.log(`Worker exited with code: ${code}`);
  });
}

// Start the migration task with specific source and target database configurations.
// `db_source_config` and `db_target_config` represent the details of the source and target databases.
startMigrationTask('db_source_config', 'db_target_config');
