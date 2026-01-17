/**
 * API Cache Utility with Request Deduplication and TTL
 *
 * Features:
 * - In-memory response caching with TTL
 * - Request deduplication (prevents multiple identical requests)
 * - Automatic cache invalidation
 * - Configurable cache times per endpoint pattern
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  // Cache TTL configuration by endpoint pattern
  private ttlConfig: { pattern: RegExp; ttl: number }[] = [
    // Static/rarely changing data - 15 minutes
    { pattern: /\/categories(?!\/\d+)/, ttl: 15 * 60 * 1000 },
    { pattern: /\/brands(?!\/\d+)/, ttl: 15 * 60 * 1000 },
    { pattern: /\/concerns/, ttl: 15 * 60 * 1000 },
    { pattern: /\/types/, ttl: 10 * 60 * 1000 },
    { pattern: /\/subcategories/, ttl: 10 * 60 * 1000 },

    // Product data - 5 minutes
    { pattern: /\/products\/featured/, ttl: 5 * 60 * 1000 },
    { pattern: /\/products\/top-selling/, ttl: 5 * 60 * 1000 },
    { pattern: /\/products\/\w+(?!\/)$/, ttl: 3 * 60 * 1000 }, // Single product
    { pattern: /\/products(?!\/)/, ttl: 2 * 60 * 1000 }, // Product lists

    // Review stats - 10 minutes (leveraging batch endpoint)
    { pattern: /\/reviews\/batch\/stats/, ttl: 10 * 60 * 1000 },
    { pattern: /\/reviews/, ttl: 5 * 60 * 1000 },

    // Offers - 5 minutes
    { pattern: /\/offers/, ttl: 5 * 60 * 1000 },

    // Analytics - 2 minutes (more dynamic)
    { pattern: /\/analytics/, ttl: 2 * 60 * 1000 },

    // User-specific data - 1 minute (most dynamic)
    { pattern: /\/cart/, ttl: 1 * 60 * 1000 },
    { pattern: /\/wishlist/, ttl: 1 * 60 * 1000 },
    { pattern: /\/addresses/, ttl: 2 * 60 * 1000 },
    { pattern: /\/orders/, ttl: 2 * 60 * 1000 },
    { pattern: /\/auth\/profile/, ttl: 5 * 60 * 1000 },
  ];

  /**
   * Get TTL for a given URL
   */
  private getTTL(url: string): number {
    for (const config of this.ttlConfig) {
      if (config.pattern.test(url)) {
        return config.ttl;
      }
    }
    return this.defaultTTL;
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached data if valid
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.getCacheKey(url, options);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.data as T;
    }

    // Clean up invalid cache
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Set cache data
   */
  set<T>(url: string, data: T, options?: RequestInit): void {
    const key = this.getCacheKey(url, options);
    const ttl = this.getTTL(url);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if request is pending (for deduplication)
   */
  getPendingRequest<T>(url: string, options?: RequestInit): Promise<T> | null {
    const key = this.getCacheKey(url, options);
    const pending = this.pendingRequests.get(key);

    if (pending) {
      // Check if pending request is not too old (30 seconds timeout)
      if (Date.now() - pending.timestamp < 30000) {
        return pending.promise as Promise<T>;
      } else {
        // Clean up stale pending request
        this.pendingRequests.delete(key);
      }
    }

    return null;
  }

  /**
   * Set pending request
   */
  setPendingRequest<T>(url: string, promise: Promise<T>, options?: RequestInit): void {
    const key = this.getCacheKey(url, options);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up after promise resolves/rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Invalidate cache by URL pattern
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const [key, _] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        valid: this.isValid(entry),
      })),
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cleanup expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cached fetch wrapper with request deduplication
 *
 * Usage:
 * const data = await cachedFetch<Product[]>('/api/products', { method: 'GET' });
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  forceRefresh = false
): Promise<T> {
  const method = options?.method || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = apiCache.get<T>(url, options);
    if (cached !== null) {
      return cached;
    }

    // Check for pending request (deduplication)
    const pending = apiCache.getPendingRequest<T>(url, options);
    if (pending) {
      return pending;
    }
  }

  // Make new request
  const promise = fetch(url, options).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    apiCache.set(url, data, options);
    return data as T;
  });

  // Track pending request
  apiCache.setPendingRequest(url, promise, options);

  return promise;
}

export default apiCache;
