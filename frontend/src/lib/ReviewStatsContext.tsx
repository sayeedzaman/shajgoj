'use client';

import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewStatsContextType {
  getReviewStats: (productId: string) => Promise<ReviewStats>;
}

const ReviewStatsContext = createContext<ReviewStatsContextType | undefined>(undefined);

// Batching configuration
const BATCH_DELAY = 50; // ms - wait 50ms to collect requests before sending
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache

interface CacheEntry {
  data: ReviewStats;
  timestamp: number;
}

export function ReviewStatsProvider({ children }: { children: React.ReactNode }) {
  const batchQueue = useRef<Set<string>>(new Set());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingRequests = useRef<Map<string, Array<(stats: ReviewStats) => void>>>(new Map());
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  // Execute batch request
  const executeBatch = useCallback(async () => {
    if (batchQueue.current.size === 0) return;

    const productIds = Array.from(batchQueue.current);
    batchQueue.current.clear();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/reviews/batch/stats?productIds=${productIds.join(',')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch batch review stats');
      }

      const statsMap: Record<string, ReviewStats> = await response.json();
      const now = Date.now();

      // Cache results and resolve pending promises
      productIds.forEach((productId) => {
        const stats = statsMap[productId] || {
          averageRating: 0,
          totalReviews: 0,
        };

        // Cache the result
        cache.current.set(productId, {
          data: stats,
          timestamp: now,
        });

        // Resolve all pending requests for this product
        const callbacks = pendingRequests.current.get(productId);
        if (callbacks) {
          callbacks.forEach((callback) => callback(stats));
          pendingRequests.current.delete(productId);
        }
      });
    } catch (error) {
      console.error('Error fetching batch review stats:', error);

      // Resolve with default values on error
      productIds.forEach((productId) => {
        const callbacks = pendingRequests.current.get(productId);
        if (callbacks) {
          const defaultStats = { averageRating: 0, totalReviews: 0 };
          callbacks.forEach((callback) => callback(defaultStats));
          pendingRequests.current.delete(productId);
        }
      });
    }
  }, []);

  // Get review stats for a product (with batching and caching)
  const getReviewStats = useCallback(
    (productId: string): Promise<ReviewStats> => {
      // Check cache first
      const cached = cache.current.get(productId);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRY) {
          return Promise.resolve(cached.data);
        } else {
          // Remove expired cache entry
          cache.current.delete(productId);
        }
      }

      // Return existing promise if already pending
      const existingCallbacks = pendingRequests.current.get(productId);
      if (existingCallbacks) {
        return new Promise((resolve) => {
          existingCallbacks.push(resolve);
        });
      }

      // Create new promise and add to batch queue
      return new Promise((resolve) => {
        pendingRequests.current.set(productId, [resolve]);
        batchQueue.current.add(productId);

        // Clear existing timeout and set new one
        if (batchTimeout.current) {
          clearTimeout(batchTimeout.current);
        }

        batchTimeout.current = setTimeout(() => {
          executeBatch();
          batchTimeout.current = null;
        }, BATCH_DELAY);
      });
    },
    [executeBatch]
  );

  return (
    <ReviewStatsContext.Provider value={{ getReviewStats }}>
      {children}
    </ReviewStatsContext.Provider>
  );
}

export function useReviewStats() {
  const context = useContext(ReviewStatsContext);
  if (context === undefined) {
    throw new Error('useReviewStats must be used within a ReviewStatsProvider');
  }
  return context;
}
