const { createReadStream, createWriteStream } = require("fs");

// const readStream = createReadStream("./anime_fight.mp4");
const writeStream = createWriteStream("./file.txt");

process.stdin.pipe(writeStream);

// pipe method allows to read data from any readable stream to any writable stream

// # pipe method automatically handles backpressure basically i.e. from "backpressure.js"
// readStream.pipe(writeStream).on("error", console.error);

// # duplex stream uses both readable and writeable stream
