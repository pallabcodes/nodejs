const http = require("http");
const fs = require("fs");
const file = "./anime_fight.mp4";

// const server = http.createServer((req, res) => {
//   // get largest data then send them as small chunk i.e. stream
//   const stream = fs.createReadStream(__dirname + "/read.txt");
//   // source.pipe(destination); // similar to  createWriteStream(destination)

//   // there are readable, writable and duplex (can be both writable & duplex) stream

//   // # ReadableStream: can act as source but not as destination i.e. source.pipe(destination)
//   // # WritableStream: can act as destination but not as source i.e. source.pipe(destination)

//   // # DuplexStream: both readable and writeable i.e. source.pipe(destination).pipe(destination)

//   // ## Backpressure, high watermarks and performance

//   // i) writable stream must send a signal back to readable streams that they're ready for more data
//   // ii) this is reason why `stream` able to what it does

//   // high watermarks: how full the stream can be before it's ready to receive further data
// });

// initialize the http server and do something
const server = http.createServer((req, res) => {
  // do something
  fs.readFile(file, (error, data) => {
    if (error) console.error(error);
    // [NOTE]: Response object i.e. res is actually a stream:
    // so it could be used as destination (.write / .pipe() does the same thing)
    res.statusCode = 200;
    res.setHeader("Content-Type", "video/mp4");
    // once again, read from the file then write/pipe to a destination stream i.e. res
    fs.createReadStream(data).pipe(res);
    // https://stackoverflow.com/questions/73266051/how-to-send-real-time-stream-response-from-server-to-client-using-node-js-expres
  });
});

// here the 2nd argument is optional
server.listen(8000);
