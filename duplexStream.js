const { PassThrough, Duplex } = require("stream");
const { createReadStream, createWriteStream } = require("fs");

const readStream = createReadStream("./anime_fight.mp4");
const writeStream = createWriteStream("./anime_copy.mp4");

class Throttle extends Duplex {
  constructor(ms) {
    super();
    this.delay = ms;
  }
  _read() {}

  // whenever writing/piping to this stream i.e. throttle; it will run _write method()
  _write(chunk, encoding, callback) {
    console.log("_write method has ran");
    this.push(chunk);
    setTimeout(callback, this.delay);
  }

  // this method will "run once" when all writing done by _write on the given data
  _final() {
    this.push(null);
  }
}

const report = new PassThrough();
const throttle = new Throttle(10);

let total = 0;

// report listening on "data" and then it may do something as needed
report.on("data", (chunk) => {
  total += chunk.length;
  console.log("bytes: ", total);
});

// readStream.pipeOrWrite(throttle).pipeOrWrite(report).pipeOrWrite(writeStream)

readStream.pipe(throttle).pipe(report).pipe(writeStream);
