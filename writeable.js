const { createReadStream, createWriteStream, read } = require("fs");

// source stream & as known it'll read as Buffer/binary data by chunk
const readStream = createReadStream("./anime_fight.mp4");

// stream destination here it's within same directory & its name will be "./copy.mp4"
const writeStream = createWriteStream("./copy.mp4");

readStream.on("data", (chunk) => {
  // asap chunk reading done then it's being written via writeStream
  writeStream.write(chunk);
  // backpressure: but what if the chunks being received fast & the present chunk hasn't even finished fully reading
  // solution: pause the next chunk until present chunk is fully read & written to its destination
});

readStream.on("error", (er) => console.log("Error: ", er));

readStream.on("end", () => {
  writeStream.end();
});

writeStream.on("close", () => {
  process.stdout.write("file copied \n");
});
