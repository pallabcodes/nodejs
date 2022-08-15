const http = require("http");
const fs = require("fs/promises");
const EventEmitter = require('events'); // this is made fully with the js not c++

class Emitter extends EventEmitter {}

const event = new Emitter();

// listener
event.on('foo', () => {
    console.log(`[foo]: event occurred`);
});
event.on('foo', (x) => {
    console.log(`[foo]: event occurred wit parameter i.e. ${x}`);
});

event.emit('foo');
console.log(`----`);
event.emit('foo', "some event");


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
