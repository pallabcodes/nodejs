const { createReadStream, createWriteStream } = require("fs");

// turn any data into stream by using createWriteStream()
const writeStream = createWriteStream("./file.txt");
const readStream = createReadStream("./file.txt");
// now whatever input given (from console) will be written to createReadStream i.e. "./file.txt"
// # "process.stdin" is a writableStream so pipe'll be writable thus "it'll write to given writeStream"
process.stdin.pipe(writeStream);

// # pipe method automatically handles backpressure basically i.e. from "backpressure.js"
// # with readableStream pipe will become readable so "it will here read from writeStream"
readStream.pipe(writeStream).on("error", console.error);

// # duplex stream uses both readable and writeable stream
