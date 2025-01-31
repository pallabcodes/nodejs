import { ReadableStream, WritableStream, TransformStream, TextDecoderStream } from 'node:stream/web';
import { setInterval } from 'node:timers/promises';
import { Readable } from 'node:stream';

async function* myCustomReadable () {
    yield Buffer.from("This is my");
    await setTimeout(200);
    yield Buffer.from("custom readable")
}

const readable = Readable.toWeb(Readable.from(myCustomReadable));

// create a Readable stream
// const readable = new ReadableStream({
//     async start(controller) {
//         for await (const i of setInterval(200)) {
//             controller.enqueue(`Hello-${new Date().toISOString()}`)
//         }
        
//     }
// });

// when reading from stream, as reading transform it or do whateve to the current chunk of stream
readable
.pipeThrough(new TextDecoderStream()) // TextDecoderStream converts Buffer to a string
.pipeThrough(new TransformStream({
    transform(chunk, controller) {
        // console.log(chunk);
        const data = chunk.toUpperCase();
        controller.enqueue(data);
    }
}))
.pipeTo(new WritableStream({
    write(chunk) {
        console.log('chunk: ', chunk);
    },

    close() {
        console.log('finished writing');
    }
}));