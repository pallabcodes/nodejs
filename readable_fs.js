const fs = require("fs");

const readStream = fs.createReadStream("./anime_fight.mp4");

readStream.on("data", (chunk) => {
  // console.log(`little chunk\n`, chunk);
  console.log(`size: `, chunk.length);
});

readStream.on("end", () => console.log(`done`));

readStream.on("error", (er) => console.log(`error: `, er));

readStream.pause();

process.stdin.on("data", (chunk) => {
  if (chunk.toString().trim() === "finish") {
    // when input given as 'finish' then stream'll go to flowing/non-pausible mode till done
    readStream.resume();
  }
  // whenever pressed "enter" it'll read chunk by chunk i.e. non-flowing/pasuable stream
  readStream.read();
});
