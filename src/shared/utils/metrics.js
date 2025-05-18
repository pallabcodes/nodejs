const metrics = {
  record: (metricName, value, tags = {}) => {
    console.log(`[metrics] ${metricName}: ${value}ms`, tags);
  },
};

module.exports = metrics;
