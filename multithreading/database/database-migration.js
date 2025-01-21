// Import the Worker class from the `worker_threads` module.
// This allows us to create worker threads for multithreaded task execution.
const { Worker } = require('worker_threads');

// Function to start the migration task
function startMigrationTask(dataSource, targetSource) {
  // Create a new worker thread to execute the migration task.
  // The worker file contains the logic for handling the migration task.
  const worker = new Worker('./worker.js', {
    workerData: { dataSource, targetSource }, // Pass initial data directly to the worker
  });

  // Listen for messages from the worker thread.
  // Worker threads communicate with the parent thread using `postMessage`.
  worker.on('message', (message) => {
    console.log(`Worker Message: ${message}`);

    // Check if the worker signals task completion with the 'done' message.
    if (message === 'done') {
      console.log('Migration complete. Terminating worker thread.');
      // Terminate the worker thread to free up resources.
      worker.terminate();
    }
  });

  // Listen for errors that may occur in the worker thread.
  worker.on('error', (error) => {
    console.error('Worker encountered an error:', error);
  });

  // Listen for the `exit` event, which indicates the worker thread has stopped.
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code: ${code}`);
    } else {
      console.log('Worker thread exited cleanly.');
    }
  });
}

// Start the migration task by calling the function with source and target database configurations.
startMigrationTask('db_source_config', 'db_target_config');
