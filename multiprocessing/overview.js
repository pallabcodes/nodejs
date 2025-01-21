const express = require('express');
const cluster = require('cluster');
const os = require('os');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5001;
const numCPUs = os.cpus().length; // Based on number of CPU cores available

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom logger middleware
function loggerMiddleware(req, res, next) {
  const requestId = uuidv4();
  console.log(`[${new Date().toISOString()}] [Request ID: ${requestId}] ${req.method} ${req.url}`);
  req.requestId = requestId;
  next();
}

app.use(loggerMiddleware);

// Sample route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the API' });
});

if (cluster.isMaster) {
  console.log(`Master process started on PID: ${process.pid}`);

  // Fork workers based on the number of available CPU cores
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork(); // Fork a worker

    worker.on('online', () => {
      console.log(`Worker ${worker.process.pid} is now online`);
    });

    worker.on('message', (msg) => {
      if (msg.action === 'task-done') {
        console.log(`Master: Worker ${worker.process.pid} completed task.`);
      }
    });
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Optionally restart a worker if it dies
  });

} else {
  // Worker processes now share the same HTTP server
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}
