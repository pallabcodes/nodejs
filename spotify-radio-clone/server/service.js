import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { PassThrough, Writable } from 'node:stream'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

import Throttle from 'throttle'
import config from './config.js'
import { logger, pipelineThatCanConsumePartialData } from './util.js'

const {
    dir: {
        publicDirectory
    },
    constants: {
        englishConversation,
        bitRateDivisor
    }
} = config

class Service {
    #clientStreams = new Map()
    #activeHandlers = new Map()
    #currentSong = englishConversation
    #currentBitRate = 0
    #throttleTransform = null
    #currentReadable = null

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
    #executeSoxCommand(args) {
        const cp = spawn('sox', args)
        this.#activeHandlers.set(cp.pid, cp)

        return cp
    }
    async #getBitRate(song) {
        const args = [
            '--i',
            '-B',
            song
        ]
        const { stdout } = await this.#executeSoxCommand(args)
        const bitrate = await once(stdout, 'data')

        return bitrate
            .toString()
            .trim()
            .replace(/k/, '000')
    }
    #broadcastToClients() {
        return new Writable({
            write: (chunk, enc, cb) => {
                for (const [key, stream] of this.#clientStreams) {
                    // if they disconnected we should ignore them
                    if (stream.writableEnded) {
                        this.#clientStreams.delete(key)
                        continue
                    }
                    stream.write(chunk)
                }

                return cb()
            }
        })
    }

    removeClientStream(id)  {
        this.#clientStreams.get(id).end()
        this.#clientStreams.delete(id)
    }

    async startStreaming() {
        logger.info(`starting with ${this.#currentSong}`)
        const bitRate = this.#currentBitRate = (await this.#getBitRate(this.#currentSong)) / bitRateDivisor
        const throttleTransform = this.#throttleTransform = new Throttle(bitRate)
        const songReadable = this.#currentReadable = this.#createFileStream(this.#currentSong)

        return pipelineThatCanConsumePartialData(
            songReadable,
            throttleTransform,
            this.#broadcastToClients()
        )
    }

    stopStreaming() {
        this.#throttleTransform.end()
        this.#currentReadable.destroy()
        for(const cp of this.#activeHandlers.values()) {
            cp.stdin.destroy()
            cp.stdout.destroy()
            cp.stderr.destroy()
        }
        this.#activeHandlers.clear()
    }
}

export default Service