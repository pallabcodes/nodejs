const { parentPort } = require('worker_threads');  // Import parentPort to allow communication with the main thread.
const Redis = require('redis');  // Import Redis library to interact with Redis.

// Connect to Redis (default localhost, port 6379)
const redisClient = Redis.createClient({
    host: 'localhost',  // Redis server running locally
    port: 6379,         // Default Redis port
});

// Gracefully handle shutdown
process.on('SIGINT', () => {
    console.log('Shutting down worker...');
    redisClient.quit(() => {
        console.log('Redis client closed');
        process.exit(0);
    });
});

// Function that processes tasks in the task queue
function processTasks() {
    redisClient.blpop('taskQueue', 0, (err, task) => {
        if (err) {
            // If there's an error fetching the task, log it and stop further execution.
            console.error('Error fetching task:', err);
            return;
        }

        // Parse the task data from the queue (task is a JSON string).
        const taskData = JSON.parse(task[1]);

        // Simulate task processing
        console.log(`Processing task ${taskData.taskId}...`);

        // Simulate a long-running task with a 5-second delay.
        setTimeout(() => {
            // Create a result message after the task is "completed".
            const result = `Task ${taskData.taskId} completed`;  // Task result after processing.

            // Send the result back to the main thread by posting a message through parentPort.
            parentPort.postMessage(JSON.stringify({
                taskId: taskData.taskId,  // Send the task ID.
                result: result            // Send the result of the task.
            }));

            // Recursively call processTasks to continue processing any new tasks in the queue.
            processTasks();
        }, 5000);  // Simulate a delay of 5 seconds before completing the task.
    });
}

// Start processing tasks immediately when the worker is created.
processTasks();
