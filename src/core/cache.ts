type CacheEntry<T> = {
  value: T;
  timestamp: number;
  expiresAt: number;
};

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private capacity: number;
  private ttlMs: number;

  constructor(capacity = 100, ttlMs = 60000) {
    this.cache = new Map();
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | undefined {
    this.purgeExpired();
    
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Refresh entry on access
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  set(key: K, value: V): void {
    // If cache is at capacity, remove least recently used item
    if (this.cache.size >= this.capacity) {
      const lruKey = this.findLRUKey();
      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttlMs
    });
  }

  private findLRUKey(): K | undefined {
    let oldestTime = Date.now();
    let oldestKey: K | undefined;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  // Remove expired entries
  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  has(key: K): boolean {
    this.purgeExpired();
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.purgeExpired();
    return this.cache.size;
  }
}