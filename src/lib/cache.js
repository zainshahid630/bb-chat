// Optimized in-memory cache with LRU eviction and memory management

class Cache {
  constructor(maxSize = 1000, maxMemoryMB = 50) {
    this.store = new Map()
    this.timestamps = new Map()
    this.accessOrder = new Map() // For LRU tracking
    this.maxSize = maxSize
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024
    this.currentMemoryUsage = 0
    this.hitCount = 0
    this.missCount = 0
    
    // Cleanup interval to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @param {number} maxAge - Max age in milliseconds (default: 30 seconds)
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key, maxAge = 30000) {
    if (!this.store.has(key)) {
      this.missCount++
      return null
    }

    const timestamp = this.timestamps.get(key)
    const age = Date.now() - timestamp

    if (age > maxAge) {
      // Expired - remove from cache
      this.invalidate(key)
      this.missCount++
      return null
    }

    // Update access order for LRU
    this.accessOrder.set(key, Date.now())
    this.hitCount++
    return this.store.get(key)
  }

  /**
   * Set value in cache with LRU eviction
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    const now = Date.now()
    const valueSize = this.estimateSize(value)
    
    // Check if we need to evict items
    if (this.store.size >= this.maxSize || 
        this.currentMemoryUsage + valueSize > this.maxMemoryBytes) {
      this.evictLRU()
    }
    
    // Remove old entry if exists
    if (this.store.has(key)) {
      this.currentMemoryUsage -= this.estimateSize(this.store.get(key))
    }
    
    this.store.set(key, value)
    this.timestamps.set(key, now)
    this.accessOrder.set(key, now)
    this.currentMemoryUsage += valueSize
  }

  /**
   * Estimate memory usage of a value
   * @param {any} value - Value to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(value) {
    if (value === null || value === undefined) return 8
    if (typeof value === 'string') return value.length * 2
    if (typeof value === 'number') return 8
    if (typeof value === 'boolean') return 4
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item), 24)
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2
    }
    return 64 // Default estimate
  }

  /**
   * Evict least recently used items
   */
  evictLRU() {
    const sortedByAccess = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]) // Sort by access time (oldest first)
    
    // Remove oldest 25% of items
    const itemsToRemove = Math.max(1, Math.floor(sortedByAccess.length * 0.25))
    
    for (let i = 0; i < itemsToRemove && sortedByAccess.length > 0; i++) {
      const [key] = sortedByAccess[i]
      this.invalidate(key)
    }
    
    console.log(`🗑️ Cache LRU eviction: removed ${itemsToRemove} items`)
  }

  /**
   * Cleanup expired entries and optimize memory
   */
  cleanup() {
    const now = Date.now()
    let removedCount = 0
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > 300000) { // Remove items older than 5 minutes
        this.invalidate(key)
        removedCount++
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired items`)
    }
  }

  /**
   * Invalidate (remove) cache entry
   * @param {string} key - Cache key
   */
  invalidate(key) {
    if (this.store.has(key)) {
      this.currentMemoryUsage -= this.estimateSize(this.store.get(key))
    }
    this.store.delete(key)
    this.timestamps.delete(key)
    this.accessOrder.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param {RegExp|string} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        this.timestamps.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear()
    this.timestamps.clear()
  }

  /**
   * Get cache size
   */
  size() {
    return this.store.size
  }

  /**
   * Get cache statistics
   */
  stats() {
    const timestamps = Array.from(this.timestamps.values())
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      memoryUsage: `${(this.currentMemoryUsage / 1024 / 1024).toFixed(2)} MB`,
      maxMemory: `${(this.maxMemoryBytes / 1024 / 1024).toFixed(2)} MB`,
      memoryUtilization: `${((this.currentMemoryUsage / this.maxMemoryBytes) * 100).toFixed(1)}%`,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Create singleton instance
export const cache = new Cache()

/**
 * Wrapper function for caching async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} maxAge - Max age in milliseconds
 * @returns {Promise<any>} Cached or fresh value
 */
export async function cached(key, fn, maxAge = 30000) {
  // Try to get from cache
  const cachedValue = cache.get(key, maxAge)
  
  if (cachedValue !== null) {
    console.log(`💾 Cache HIT: ${key}`)
    return cachedValue
  }

  // Cache miss - execute function
  console.log(`🔍 Cache MISS: ${key}`)
  const value = await fn()
  
  // Store in cache
  cache.set(key, value)
  
  return value
}

/**
 * Invalidate cache when data changes
 */
export function invalidateCache(pattern) {
  console.log(`🗑️ Invalidating cache: ${pattern}`)
  cache.invalidatePattern(pattern)
}

// Export cache instance as default
export default cache

