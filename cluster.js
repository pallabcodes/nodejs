const express = require('express');
const cluster = require('cluster');
const os = require('os');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { Worker, isMainThread, parentPort } = require('worker_threads');

const PORT = process.env.PORT || 5001;
const numCPUs = os.cpus().length; // Based on number of CPU cores available

console.info(`Server is running on port: ${PORT}, using ${numCPUs} CPU cores`);

// Custom logger middleware
function loggerMiddleware(req, res, next) {
  const requestId = uuidv4();
  console.log(`[${new Date().toISOString()}] [Request ID: ${requestId}] ${req.method} ${req.url}`);
  req.requestId = requestId;
  next();
}

// Express app initialization
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Mutex Lock: To simulate handling race conditions
let mutex = false;  // Flag for lock
let dataCache = {};  // Shared data across workers

// Sample routes to demonstrate functionality
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the API' });
});

// Simulate a task where lock is needed
app.post('/lock-test', async (req, res) => {
  // If lock is active, deny request
  if (mutex) {
    res.status(503).json({ message: 'Resource is locked by another process. Try again later.' });
    return;
  }

  mutex = true; // Acquire lock

  // Simulate a long-running task (3 seconds)
  console.log(`Worker ${process.pid} acquiring lock`);
  setTimeout(() => {
    dataCache = { result: 'Task completed' }; // Example of shared data between workers
    console.log(`Task completed by worker ${process.pid}`);
    mutex = false; // Release lock
    res.status(200).json({ message: 'Task completed successfully' });
  }, 3000);
});

// Process Communication and Task Distribution via Worker Threads
// This demonstrates handling tasks by managing workers explicitly
if (cluster.isMaster) {
  console.log(`Master process started on PID: ${process.pid}`);

  // Fork workers based on the number of available CPU cores
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork(); // Fork a worker

    worker.on('online', () => {
      console.log(`Worker ${worker.process.pid} is now online and ready to handle requests.`);
    });

    worker.on('message', (msg) => {
      if (msg.action === 'task-done') {
        console.log(`Master: Worker ${worker.process.pid} has completed its task.`);
        // Here we can explicitly shut down or restart workers if needed
        worker.kill(); // Kill the worker after task completion (optional)
      }
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Optionally, we could restart the worker
    // cluster.fork();
  });
} else {
  // Worker processes now share the same HTTP server
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });

  // Simulate worker handling a task with worker thread (processing specific tasks in parallel)
  const worker = new Worker('./worker-task.js');  // External worker file for task handling

  worker.on('message', (msg) => {
    console.log(`Worker ${process.pid} received message:`, msg);
  });

  // Simulate a scenario where this worker could handle specific tasks asynchronously
  setTimeout(() => {
    worker.postMessage({ action: 'start-task', pid: process.pid });  // Send task to worker
  }, 1000);
}