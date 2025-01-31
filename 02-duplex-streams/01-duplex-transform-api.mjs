import { Duplex, Transform } from "node:stream";

// By default, when data is being written; it will be a Buffer

// A Duplex stream (as below) could be both a Writeable and Readable stream
const server = Duplex({
    objectMode: true, // with this, instead of the default Buffer, now it will be convert Buffer -> String (object) and so string value will be displayed as output
    
    // Below method writes from stream
    write(chunk, enc, callback) {
        console.log(`[writable] saving`, chunk);
        callback();
    },

    // Below method reads from stream (or in this case string due to `objectMode`)
    read() {
        const everySecond = (intervalContext) => {
            this.counter = this.counter ?? 0;
        
            if(this.counter++ <= 5) {
                this.push(`My name is Pallab[${this.counter}]`);
                return;
            }
            
            clearInterval(intervalContext);
            this.push(null);
        };

        setInterval(function () {everySecond(this)})
    }
});

// to prove that they're different communication channels
// write triggers for the writable stream i.e. server from duplex
server.write('[duplex] key this is a writable\n');

// on data -> our server.on(data) will be triggerd everytime whenever push function is invoked
server.push(`[duplex] hey this is a readable`);

const transformToUpperCase = Transform({
    objectMode: true,
    transform(chunk, enc, callback) {
        callback(null, chunk.toUpperCase());
    }
});

transformToUpperCase.write(`[transform] hello from writer`);
// the push method will ignore what you have in the transform function
transformToUpperCase.push (`[transform] hello from reader`);

server
.pipe(transformToUpperCase)
// it will redirect all data to the duplex's writable channel
.pipe(server)



