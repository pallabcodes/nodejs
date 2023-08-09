const fs = require("fs");

// first, take the data and turn it into a readable stream by using createReadStream() 
// [NOTE]: stream takes the data & turn it into binary/Buffer; all chunk's size allocated dynamically 
const readStream = fs.createReadStream("./anime_fight.mp4");

// now listen on the event 'data' to know/do something whenever the data is emitted
readStream.on("data", (chunk) => {
  console.log(`little chunk\n`, chunk);
  // console.log(`size: `, chunk.length);
});

readStream.on("end", () => console.log(`done`));

readStream.on("error", (er) => console.log(`error: `, er));

// default behavior, readable stream will read chunk by chunk until all done

// readable stream could be paused and resumed; here paused to prevent its default behavior
readStream.pause(); 

process.stdin.on("data", (chunk) => {
  if (chunk.toString().trim() === "finish") {
    // when input given as 'finish' then stream go to flowing mode (i.e. keep reading chunks until all  done)
    readStream.resume();
  }
  // whenever pressed "enter" it'll read chunk by chunk i.e. non-flowing/pauseable stream
  readStream.read();
});
