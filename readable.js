const { Readable } = require("stream");

const advices = [
  `to buy a house`,
  `first get the skills`,
  `the find the workplace`,
  `that will offer at least 400000 salary`,
  `after that will be eligile to think about own house`,
];

class StreamArray extends Readable {
  constructor(array) {
    // super({ encoding: "utf-8" }); // encoding: "utf-8" convert buffer/binary data to string
    super({ objectMode: true });
    this.array = array;
    this.index = 0;
  }
  _read() {
    // stream can data as  binary or object
    if (this.index <= this.array.length) {
      // const chunk = this.array[this.index];
      const chunk = { data: this.array[this.index], index: this.index }; // when using the objectMode
      this.push(chunk);
      this.index++;
    } else this.push(null);
  }
}

const adviceStream = new StreamArray(advices);

adviceStream.on("data", (chunk) => console.log(chunk));
adviceStream.on("end", () => console.log("done"));
