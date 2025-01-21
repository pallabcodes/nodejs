import { it, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { getTestServer, pipeAndReadStreamData } from './helpers.js'

const RETENTION_PERIOD = 100

describe('API E2E Test Suite', () => {

    describe('client workflow', () => {
        let _server;
        beforeEach(async () => {
            _server = await getTestServer()
        })
        afterEach(async () => {
            await _server.killServer()
        })

        it('should not receive data stream if the process is not playing', async (context) => {
            const { url } = _server
            const onChunk = context.mock.fn()
            await pipeAndReadStreamData(url, onChunk, RETENTION_PERIOD)

            assert.strictEqual(
                onChunk.mock.callCount(), 0,
                `Expect onChunk to not have been called, but got ${onChunk.mock.callCount()}`
            )
        })
    })
})