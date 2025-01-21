const { parentPort } = require('worker_threads');

// Listen for messages from the main thread
parentPort.on('message', (msg) => {
  console.log('Worker received:', msg);

  if (msg.action === 'start') {
    // Simulate a long-running task
    setTimeout(() => {
      try {
        // Simulate a successful task
        const taskCompletedSuccessfully = true;

        if (taskCompletedSuccessfully) {
          console.log('Task complete');
          // Send 'done' status when task is successful
          parentPort.postMessage({ status: 'done', result: 'Task completed successfully' });
        } else {
          // Simulate an error
          throw new Error('Something went wrong during the task.');
        }
      } catch (error) {
        // Send 'error' status if an error occurs
        parentPort.postMessage({ status: 'error', result: error.message });
      }
    }, 1000 * 60); // Simulating 1-minute delay
  }
});
