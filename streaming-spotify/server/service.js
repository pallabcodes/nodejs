import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import config from './config.js'
import { randomUUID } from 'node:crypto'
import { PassThrough } from 'node:stream'
const {
    dir: {
        publicDirectory
    },
} = config

class Service {
    #clientStreams = new Map()


    #createFileStream(file) {
        return fs.createReadStream(file)
    }

    async getFileInfo(file) {
        const fullPathFile = path.join(publicDirectory, file)
        await fsPromises.access(fullPathFile)
        const fileType = path.extname(fullPathFile)
        return {
            type: fileType,
            name: fullPathFile
        }
    }

    async getFileStream(file) {
        const {
            name,
            type
        } = await this.getFileInfo(file)

        return {
            stream: this.#createFileStream(name),
            type
        }
    }

    getClientStream() {
        const id = randomUUID()
        const clientStream = new PassThrough()
        this.#clientStreams.set(id, clientStream)
        //  just to unlock streams during tests and keep the connection opened
        clientStream.write(Buffer.alloc(1))

        return {
            id,
            clientStream
        }
    }


}

export default Service