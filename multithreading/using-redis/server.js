const express = require('express');
const http = require('http');
const { Worker } = require('worker_threads');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');

// Connect to Redis
const redisClient = Redis.createClient({
  host: 'localhost',  // Change if using a remote Redis instance
  port: 6379,
});

// Gracefully handle shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  redisClient.quit(() => {
    console.log('Redis client closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5001;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Task queue and result queue keys in Redis
const TASK_QUEUE = 'taskQueue';
const RESULT_QUEUE = 'resultQueue';

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

// Route for starting tasks
app.post('/start-task', (req, res) => {
  const taskId = uuidv4();  // Generate a unique task ID for the new task.

  const taskData = { action: 'start', taskId };  // Task data with action and task ID.

  // Add the task to the 'taskQueue' in Redis using rpush (right push).
  redisClient.rpush(TASK_QUEUE, JSON.stringify(taskData), (err) => {
    if (err) {
      // If there's an error adding the task to the queue, return a 500 status with an error message.
      return res.status(500).json({ message: 'Error adding task to queue' });
    }

    // If the task was successfully added to the queue, respond with the task ID.
    res.status(200).json({ message: 'Task started', taskId });
  });
});

// Route for checking task status by task ID
app.get('/task-status/:taskId', (req, res) => {
  const taskId = req.params.taskId;  // Extract task ID from the URL parameter.

  // Fetch all results from the 'resultQueue' in Redis to find the status of the task.
  redisClient.lrange(RESULT_QUEUE, 0, -1, (err, results) => {
    if (err) {
      // If there's an error fetching results, return a 500 status with an error message.
      return res.status(500).json({ message: 'Error fetching task status' });
    }

    // Search the results to find the specific task by its ID.
    const taskStatus = results.find((result) => {
      const resultData = JSON.parse(result);
      return resultData.taskId === taskId;  // Match by task ID.
    });

    if (taskStatus) {
      // If the task result is found, return the status as 'Completed' with the result.
      res.status(200).json({ status: 'Completed', result: JSON.parse(taskStatus).result });
    } else {
      // If the task result isn't found, return 'In Progress' status.
      res.status(200).json({ status: 'In Progress' });
    }
  });
});

// Function to start a task worker that processes tasks continuously.
function startTaskWorker() {
  const worker = new Worker('./task-worker.js');  // Create a worker that will handle tasks.

  // Listen for messages (task results) from the worker thread.
  worker.on('message', (msg) => {
    const taskData = JSON.parse(msg);  // Parse the task result from the message.

    // Push the result to the 'resultQueue' in Redis for future status checks.
    redisClient.rpush(RESULT_QUEUE, JSON.stringify(taskData), (err) => {
      if (err) {
        // Log any errors while pushing the result to the queue.
        console.error('Error adding result to queue:', err);
      }
    });
  });

  // Handle any worker errors.
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
}

// Start the worker to process tasks when the server starts.
startTaskWorker();

// Listen on the specified port (5001 or process.env.PORT).
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
