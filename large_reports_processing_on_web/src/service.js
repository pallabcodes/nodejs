export default class Service {

  processFile({ query, file, onOcurrenceUpdate, onProgress }) {
    const lineCounter = { counter: 0 }

    file.stream()
      // transform streams
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(this.#updateProgressBar({ onProgress, fileSize: file.size }))
      .pipeThrough(this.#csvToJSON())
      .pipeThrough(this.#countLines(lineCounter))
      .pipeThrough(this.#findOcurrences(query))
      // writable streams
      .pipeTo(this.#notifyProgressBar({ onOcurrenceUpdate, lineCounter }))
    // .pipeTo(
    //   new WritableStream({
    //     write(chunk) {
    //       console.log('chunk', chunk)
    //     }
    //   })
    // )
  }

  #notifyProgressBar({ onOcurrenceUpdate, lineCounter }) {
    const startedAt = performance.now()
    const elapsed = () => `${((performance.now() - startedAt) / 1000).toFixed(2)} secs`
    return new WritableStream({
      write(found) {
        onOcurrenceUpdate({
          found,
          took: elapsed(),
          lineCounter: lineCounter.counter
        })
      }
    })
  }

  #findOcurrences(query) {
    // { 'call-description': 'ski' }
    const queryKeys = Object.keys(query)
    let found = {}
    return new TransformStream({
      transform(chunk, controller) {
        for (const key of queryKeys) {
          const value = query[key]
          found[value] = found[value] ?? 0
          if (value.test(chunk[key])) {
            found[value]++
          }
          controller.enqueue(found)
        }

      }
    })
  }

  #countLines(lineCounter) {
    return new TransformStream({
      transform(chunk, controller) {
        lineCounter.counter++

        controller.enqueue(chunk)
      }
    })
  }

  #updateProgressBar({ onProgress, fileSize }) {
    let totalUpdated = 0
    onProgress(0)

    return new TransformStream({
      transform(chunk, controller) {

        totalUpdated += chunk.length
        const total = 100 / fileSize * totalUpdated
        onProgress(total)
        controller.enqueue(chunk)
      }
    })
  }
  #csvToJSON() {
    let _delimiter = ','
    let _columns = ''
    let _buffer = ''
    const BREAKLINE_SYMBOL = "\n"
    const INDEX_NOT_FOUND = -1
    return new TransformStream({
      transform(chunk, controller) {

        // it'll ensure if we got a chunk that is not completed 
        // and doesnt have a breakline 
        // will concat with the previous read chunk
        // 1st time = 01,
        // 2st time = ,erick,adreress\n
        // try parsing and returning data!
        _buffer = _buffer.concat(chunk)
        let breaklineIndex = 0
        while (breaklineIndex !== INDEX_NOT_FOUND) {
          breaklineIndex = _buffer.indexOf(BREAKLINE_SYMBOL)
          if (breaklineIndex === INDEX_NOT_FOUND) break
          const lineData = consumeLineData(breaklineIndex)
          // first line is the column
          if (!_columns.length) {
            _columns = lineData.split(_delimiter)
            continue
          }
          // ignore this line if it's an empty line
          if (lineData === BREAKLINE_SYMBOL) continue
          const result = getJSONLine(lineData)
          if (!result) continue

          controller.enqueue(result)
        }
      }
    })

    function getJSONLine(lineData) {
      const removeBreakLine = (text) => text.replace(BREAKLINE_SYMBOL, "")
      const headers = Array.from(_columns)
      const dataProperties = []
      for (const lineValue of lineData.split(_delimiter)) {
        const key = removeBreakLine(headers.shift())
        const value = removeBreakLine(lineValue)
        const finalValue = value.trimEnd().replace(/"/g, '')
        dataProperties.push(`"${key}":"${finalValue}"`)
      }
      if (!dataProperties.length) return null
      const data = dataProperties.join(',')
      return JSON.parse('{'.concat(data).concat('}'))
    }

    function consumeLineData(breaklineIndex) {
      const lineToProcessIndex = breaklineIndex + BREAKLINE_SYMBOL.length
      const line = _buffer.slice(0, lineToProcessIndex)
      //  I'll remove from the main buffer the first information untill the \n
      // 01,erick,02\n03,ana,05\n
      // line = 01,erick,02\n
      // _buffer = 03,ana,05\n

      _buffer = _buffer.slice(lineToProcessIndex)

      return line
    }

  }
}
