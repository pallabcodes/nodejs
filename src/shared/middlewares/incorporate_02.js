// how to implement it in the current architecture

// a. Use Object.freeze or Immutable.js on ctx to avoid accidental mutation bugs in middleware chains.
// b. Export middleware pipeline metadata and durations to generate runtime visualizations (e.g., with d3.js) to debug bottlenecks visually.
// c. Add middleware wrappers to retry transient errors (e.g., DB timeouts) or fallback on degraded mode.
// d. Allow middleware to return special signals to skip downstream middleware or jump to cleanup handlers (useful for caching layers).
// e. Support cancellation tokens or timeout-aware middleware to abort long-running handlers cleanly.

