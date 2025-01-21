const express = require('express');
const http = require('http');
const { Worker } = require('worker_threads');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5001;

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

// Route for starting a long-running task using worker threads
app.post('/start-task', (req, res) => {
  const worker = new Worker('./task-worker.js');  // create a Worker with the given file

  worker.on('message', (msg) => {
    console.log('Main thread received:', msg);
    res.status(200).json({ message: 'Task completed successfully' });
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
    res.status(500).json({ message: 'Worker encountered an error' });
  });

  worker.postMessage({ action: 'start' });
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
