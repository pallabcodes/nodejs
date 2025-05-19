// Basic APM (Application Performance Monitoring) setup
// In production, you would typically use services like New Relic, Datadog, or Elastic APM

class APM {
  constructor() {
    this.transactions = new Map();
    this.isEnabled = process.env.ENABLE_APM === 'true';
  }

  startTransaction(name, type = 'custom') {
    if (!this.isEnabled) return null;

    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'started',
      tags: {},
      context: {}
    };

    this.transactions.set(transaction.id, transaction);
    return transaction.id;
  }

  endTransaction(id, status = 'success') {
    if (!this.isEnabled || !id) return;

    const transaction = this.transactions.get(id);
    if (!transaction) return;

    transaction.endTime = Date.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.status = status;

    // In production, you would send this to your APM service
    if (process.env.NODE_ENV === 'development') {
      console.log('Transaction completed:', {
        id: transaction.id,
        name: transaction.name,
        duration: `${transaction.duration}ms`,
        status: transaction.status
      });
    }

    this.transactions.delete(id);
  }

  setTransactionTag(id, key, value) {
    if (!this.isEnabled || !id) return;

    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.tags[key] = value;
    }
  }

  setTransactionContext(id, context) {
    if (!this.isEnabled || !id) return;

    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.context = { ...transaction.context, ...context };
    }
  }

  // Middleware to track HTTP requests
  middleware() {
    return (req, res, next) => {
      if (!this.isEnabled) {
        next();
        return;
      }

      const transactionId = this.startTransaction(
        `${req.method} ${req.path}`,
        'http'
      );

      // Add transaction ID to request for use in other middleware
      req.apmTransactionId = transactionId;

      // Set basic context
      this.setTransactionContext(transactionId, {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });

      // Track response
      res.on('finish', () => {
        this.setTransactionTag(transactionId, 'statusCode', res.statusCode);
        this.endTransaction(
          transactionId,
          res.statusCode < 400 ? 'success' : 'error'
        );
      });

      next();
    };
  }
}

// Export singleton instance
export const apm = new APM();
export default apm; 