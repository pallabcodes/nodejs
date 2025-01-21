const http = require("http");
const fs = require("fs/promises");
const EventEmitter = require('events'); // this is made fully with the js not c++

class Emitter extends EventEmitter { }

const event = new Emitter();

// listener
event.on('foo', () => {
    console.log(`[foo]: no parameter`);
});
event.on('foo', (x) => {
    console.log(`[foo]: Just emitted foo event ${JSON.stringify(x)}`);
});

// emitter
event.emit('foo');
console.log(`----`);
event.emit('foo', { data: "some data" });
console.log(`----`);


const PORT = 8000;
const server = http.createServer(async (request, response) => {
    const contentBuffer = await fs.readFile(__dirname + "/text.txt");
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/plain");
    response.end(contentBuffer.toString('utf-8'));
});

server.listen(PORT, () => {
    console.log(`server started on ${PORT}`);
});


// native modules : File, Os, Worker Threads, Child process, argv and EventEmitter