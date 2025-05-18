import { v4 as uuidv4 } from 'uuid';

const TRACE_HEADER = 'x-trace-id';
const SPAN_HEADER = 'x-span-id';
const PARENT_SPAN_HEADER = 'x-parent-span-id';

class Span {
  constructor(name, traceId, parentSpanId = null) {
    this.id = uuidv4();
    this.name = name;
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.startTime = Date.now();
    this.endTime = null;
    this.tags = new Map();
    this.logs = [];
    this.children = [];
  }

  addTag(key, value) {
    this.tags.set(key, value);
    return this;
  }

  addLog(fields) {
    this.logs.push({
      timestamp: Date.now(),
      fields
    });
    return this;
  }

  addChild(span) {
    this.children.push(span);
    return this;
  }

  finish() {
    this.endTime = Date.now();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime ? this.endTime - this.startTime : null,
      tags: Object.fromEntries(this.tags),
      logs: this.logs,
      children: this.children.map(child => child.toJSON())
    };
  }
}

const createTracer = (options = {}) => {
  const {
    serviceName = 'unknown-service',
    samplingRate = 1.0,
    maxSpans = 1000
  } = options;

  const spans = new Map();
  let currentSpan = null;

  const startSpan = (name, parentSpan = null) => {
    if (spans.size >= maxSpans) {
      throw new Error('Maximum number of spans reached');
    }

    const traceId = parentSpan ? parentSpan.traceId : uuidv4();
    const span = new Span(name, traceId, parentSpan?.id);
    
    if (parentSpan) {
      parentSpan.addChild(span);
    }

    spans.set(span.id, span);
    currentSpan = span;
    return span;
  };

  const getCurrentSpan = () => currentSpan;

  const finishSpan = (span = currentSpan) => {
    if (!span) {
      throw new Error('No active span');
    }

    span.finish();
    if (span === currentSpan) {
      currentSpan = span.parentSpanId ? spans.get(span.parentSpanId) : null;
    }
    return span;
  };

  const extractContext = (headers) => {
    const traceId = headers[TRACE_HEADER];
    const parentSpanId = headers[PARENT_SPAN_HEADER];
    
    if (!traceId) return null;

    return {
      traceId,
      parentSpanId
    };
  };

  const injectContext = (span, headers = {}) => {
    if (!span) return headers;

    return {
      ...headers,
      [TRACE_HEADER]: span.traceId,
      [SPAN_HEADER]: span.id,
      [PARENT_SPAN_HEADER]: span.parentSpanId
    };
  };

  const getTrace = (traceId) => {
    const traceSpans = Array.from(spans.values())
      .filter(span => span.traceId === traceId);
    
    return traceSpans.length > 0 ? traceSpans : null;
  };

  const clearSpans = () => {
    spans.clear();
    currentSpan = null;
  };

  return {
    startSpan,
    finishSpan,
    getCurrentSpan,
    extractContext,
    injectContext,
    getTrace,
    clearSpans
  };
};

// Singleton instance
const tracer = createTracer({
  serviceName: process.env.SERVICE_NAME || 'api-service'
});

export { tracer as Tracer, TRACE_HEADER, SPAN_HEADER, PARENT_SPAN_HEADER }; 