const { Transform } = require("stream");

class ReplaceText extends Transform {
  constructor(char) {
    super();
    this.replaceChar = char;
  }
  // this _transform will be called (by default) whenever a value written to this stream i.e xStream
  _transform(chunk, encoding, callback) {
    console.log("_transform has been called");
    const transformChunk = chunk.toString().replace(/[a-z]|[A-Z]|[0-9]/g, this.replaceChar);

    // now here it gets the push() from its parent i.e. Transform
    this.push(transformChunk); // adding to "the whichever writableStream being used currently"

    // this callback takes two optional argument error, data: this helps to transform data
    callback();
  }

  _flush(callback) {
    console.log("flush has been called");
    this.push("more stuff is being passed through");
    callback();
  }
}

const xStream = new ReplaceText("X");
// xStream is a stream, & now it takes value and 1) write to xStream then 2) write to process.stdout

process.stdin.pipe(xStream).pipe(process.stdout);

// [NOTE]: process.stdin and process.stdout are actually a stream and previously written/piped stream is available on the next write/pipe
