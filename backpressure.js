const { createReadStream, createWriteStream, read } = require("fs");

// source stream & as known it'll read as Buffer/binary data by chunk
const readStream = createReadStream("./anime_fight.mp4");

// stream destination here it's within same directory & its name will be "./copy.mp4"
// highWaterMark: 1628920 = size that it should fill before receiving the next chunk
const writeStream = createWriteStream("./copy.mp4", {
  // highWaterMark: 1628920
});

readStream.on("data", (chunk) => {
  const result = writeStream.write(chunk);
  // backpressure: but what if the chunks being received fast & the present chunk hasn't even finished fully reading
  // solution: pause the next chunk until present chunk is fully read & written to its destination

  if (!result) {
    console.log(`has backpressure: so pause reading to not receive next chunk`);
    readStream.pause();
  }
});

readStream.on("error", (er) => console.log("Error: ", er));

readStream.on("end", () => {
  writeStream.end();
});

writeStream.on("drain", () => {
  console.log("drained: read stream is done & so it can receive next chunk now");
  readStream.resume();
});

writeStream.on("close", () => {
  process.stdout.write("file copied or written to the destination \n");
});
