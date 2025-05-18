const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

const createCircuitBreaker = (options = {}) => {
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    monitorInterval = 1000
  } = options;

  let state = STATES.CLOSED;
  let failures = 0;
  let lastFailureTime = null;
  let monitorTimer = null;

  const reset = () => {
    failures = 0;
    lastFailureTime = null;
    state = STATES.CLOSED;
  };

  const trip = () => {
    state = STATES.OPEN;
    lastFailureTime = Date.now();
    failures = 0;
  };

  const halfOpen = () => {
    state = STATES.HALF_OPEN;
  };

  const recordSuccess = () => {
    if (state === STATES.HALF_OPEN) {
      reset();
    }
  };

  const recordFailure = () => {
    failures++;
    lastFailureTime = Date.now();

    if (failures >= failureThreshold) {
      trip();
    }
  };

  const canExecute = () => {
    if (state === STATES.CLOSED) return true;
    if (state === STATES.OPEN) {
      if (Date.now() - lastFailureTime >= resetTimeout) {
        halfOpen();
        return true;
      }
      return false;
    }
    return state === STATES.HALF_OPEN;
  };

  const execute = async (fn) => {
    if (!canExecute()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (error) {
      recordFailure();
      throw error;
    }
  };

  const getState = () => ({
    state,
    failures,
    lastFailureTime,
    failureThreshold,
    resetTimeout
  });

  const startMonitoring = (callback) => {
    if (monitorTimer) return;
    
    monitorTimer = setInterval(() => {
      callback(getState());
    }, monitorInterval);
  };

  const stopMonitoring = () => {
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
    }
  };

  return {
    execute,
    getState,
    reset,
    startMonitoring,
    stopMonitoring
  };
};

// Create a registry of circuit breakers
const circuitBreakers = new Map();

const getCircuitBreaker = (name, options) => {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, createCircuitBreaker(options));
  }
  return circuitBreakers.get(name);
};

export { getCircuitBreaker as CircuitBreaker, STATES as CircuitBreakerStates }; 