// The worker-task.js file (separate file for worker task handling)
// This is how worker threads can be used to process tasks in parallel

const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => {
  if (msg.action === 'start-task') {
    console.log(`Worker ${process.pid} starting task for PID: ${msg.pid}`);
    // Perform some long-running task here
    setTimeout(() => {
      parentPort.postMessage({ status: 'done', pid: process.pid });  // Send back completion message
    }, 5000); // Simulate task completion
  }
});


