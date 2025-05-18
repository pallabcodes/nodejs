import { EventEmitter } from 'events';

class Metric {
  constructor(name, type, labels = {}) {
    this.name = name;
    this.type = type;
    this.labels = labels;
    this.value = 0;
    this.timestamp = Date.now();
  }

  update(value) {
    this.value = value;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      labels: this.labels,
      value: this.value,
      timestamp: this.timestamp
    };
  }
}

class Counter extends Metric {
  constructor(name, labels = {}) {
    super(name, 'counter', labels);
  }

  increment(value = 1) {
    this.value += value;
    this.timestamp = Date.now();
  }

  decrement(value = 1) {
    this.value = Math.max(0, this.value - value);
    this.timestamp = Date.now();
  }
}

class Gauge extends Metric {
  constructor(name, labels = {}) {
    super(name, 'gauge', labels);
  }

  set(value) {
    this.update(value);
  }
}

class Histogram extends Metric {
  constructor(name, labels = {}, buckets = [0.1, 0.5, 1, 2.5, 5, 10]) {
    super(name, 'histogram', labels);
    this.buckets = buckets;
    this.count = 0;
    this.sum = 0;
    this.bucketCounts = new Map(buckets.map(b => [b, 0]));
  }

  observe(value) {
    this.count++;
    this.sum += value;
    this.timestamp = Date.now();

    for (const bucket of this.buckets) {
      if (value <= bucket) {
        this.bucketCounts.set(bucket, (this.bucketCounts.get(bucket) || 0) + 1);
      }
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      count: this.count,
      sum: this.sum,
      buckets: Array.from(this.bucketCounts.entries()).map(([bucket, count]) => ({
        bucket,
        count
      }))
    };
  }
}

const createMetrics = (options = {}) => {
  const {
    serviceName = process.env.SERVICE_NAME || 'api-service',
    flushInterval = 60000, // 1 minute
    maxMetrics = 1000
  } = options;

  const metrics = new Map();
  const events = new EventEmitter();
  let flushTimer = null;

  const createMetricKey = (name, labels) => {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  };

  const getOrCreateMetric = (name, type, labels = {}) => {
    const key = createMetricKey(name, labels);
    
    if (metrics.size >= maxMetrics && !metrics.has(key)) {
      throw new Error('Maximum number of metrics reached');
    }

    if (!metrics.has(key)) {
      let metric;
      switch (type) {
        case 'counter':
          metric = new Counter(name, labels);
          break;
        case 'gauge':
          metric = new Gauge(name, labels);
          break;
        case 'histogram':
          metric = new Histogram(name, labels);
          break;
        default:
          throw new Error(`Unknown metric type: ${type}`);
      }
      metrics.set(key, metric);
    }

    return metrics.get(key);
  };

  const counter = (name, labels = {}) => {
    return getOrCreateMetric(name, 'counter', labels);
  };

  const gauge = (name, labels = {}) => {
    return getOrCreateMetric(name, 'gauge', labels);
  };

  const histogram = (name, labels = {}, buckets) => {
    return getOrCreateMetric(name, 'histogram', labels, buckets);
  };

  const getMetrics = () => {
    return Array.from(metrics.values()).map(metric => metric.toJSON());
  };

  const startFlush = (callback) => {
    if (flushTimer) return;

    flushTimer = setInterval(() => {
      const metricsData = getMetrics();
      events.emit('flush', metricsData);
      if (callback) callback(metricsData);
    }, flushInterval);
  };

  const stopFlush = () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  };

  const clear = () => {
    metrics.clear();
  };

  // Add request metrics middleware
  const requestMetrics = (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    // Increment request counter
    counter('http_requests_total', { method, path: url }).increment();

    // Track request duration
    const durationHistogram = histogram('http_request_duration_seconds', { method, path: url });

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // Convert to seconds
      durationHistogram.observe(duration);

      // Track response status
      counter('http_responses_total', {
        method,
        path: url,
        status: res.statusCode
      }).increment();
    });

    next();
  };

  return {
    counter,
    gauge,
    histogram,
    getMetrics,
    startFlush,
    stopFlush,
    clear,
    events,
    requestMetrics
  };
};

// Singleton instance
const metrics = createMetrics();

export { metrics as Metrics }; 