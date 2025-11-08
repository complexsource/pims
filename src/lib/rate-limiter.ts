// src/lib/rate-limiter.ts

interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxRequestsPerHour: number;
  maxRequestsPer24Hours: number;
  maxMBPerHour: number;
  maxGBPer24Hours: number;
  delayBetweenRequests: number; // milliseconds
}

interface RequestRecord {
  timestamp: number;
  bytes?: number; // Track response size
}

export class RateLimiter {
  private requests: RequestRecord[] = [];
  private config: RateLimitConfig;
  private lastRequestTime: number = 0;
  private totalBytesDownloaded: number = 0;

  constructor(config?: Partial<RateLimitConfig>) {
    // Use VERY conservative limits to avoid suspension
    this.config = {
      maxRequestsPerSecond: 2, // Under 4 RPS warning limit
      maxRequestsPerHour: 5000, // Under 7200 warning limit
      maxRequestsPer24Hours: 30000, // Under 40000 warning limit
      maxMBPerHour: 2000, // Only 65% of 3072 MB warning limit - VERY SAFE
      maxGBPer24Hours: 30, // Under 40 GB warning limit (75% of limit)
      delayBetweenRequests: 500, // 500ms = 2 requests/second
      ...config,
    };
  }

  /**
   * Wait if necessary to respect rate limits
   */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Clean old requests (older than 24 hours)
    this.cleanOldRequests(now);

    // Check 24-hour request limit
    if (this.requests.length >= this.config.maxRequestsPer24Hours) {
      const oldestRequest = this.requests[0];
      const waitTime = 24 * 60 * 60 * 1000 - (now - oldestRequest.timestamp);
      
      if (waitTime > 0) {
        console.warn(`⚠️  24-hour request limit approaching (${this.requests.length}/${this.config.maxRequestsPer24Hours}). Waiting ${Math.ceil(waitTime / 1000)}s...`);
        await this.sleep(waitTime);
        this.cleanOldRequests(Date.now());
      }
    }

    // Check 24-hour bandwidth limit
    const bytes24h = this.getBandwidthInWindow(now, 24 * 60 * 60 * 1000);
    const gb24h = bytes24h / (1024 * 1024 * 1024);
    if (gb24h >= this.config.maxGBPer24Hours) {
      const oldestRequest = this.requests.find(r => r.bytes && r.bytes > 0);
      if (oldestRequest) {
        const waitTime = 24 * 60 * 60 * 1000 - (now - oldestRequest.timestamp);
        if (waitTime > 0) {
          console.warn(`⚠️  24-hour bandwidth limit reached (${gb24h.toFixed(2)}GB/${this.config.maxGBPer24Hours}GB). Waiting ${Math.ceil(waitTime / 1000)}s...`);
          await this.sleep(waitTime);
        }
      }
    }

    // Check hourly request limit
    const lastHourRequests = this.getRequestsInWindow(now, 60 * 60 * 1000);
    if (lastHourRequests >= this.config.maxRequestsPerHour) {
      const oldestInHour = this.requests.find(
        r => r.timestamp > now - 60 * 60 * 1000
      );
      if (oldestInHour) {
        const waitTime = 60 * 60 * 1000 - (now - oldestInHour.timestamp) + 60000; // Add 1 minute buffer
        if (waitTime > 0) {
          console.warn(`⚠️  Hourly request limit approaching (${lastHourRequests}/${this.config.maxRequestsPerHour}). Waiting ${Math.ceil(waitTime / 1000)}s...`);
          await this.sleep(waitTime);
        }
      }
    }

    // Check hourly bandwidth limit - CRITICAL
    const bytesPerHour = this.getBandwidthInWindow(now, 60 * 60 * 1000);
    const mbPerHour = bytesPerHour / (1024 * 1024);
    if (mbPerHour >= this.config.maxMBPerHour) {
      // We're at limit - wait for the hour to roll over
      const oldestInHour = this.requests.find(
        r => r.timestamp > now - 60 * 60 * 1000 && r.bytes && r.bytes > 0
      );
      
      if (oldestInHour) {
        const waitTime = 60 * 60 * 1000 - (now - oldestInHour.timestamp) + 300000; // Add 5 minute buffer
        console.warn(`\n🚨 BANDWIDTH LIMIT REACHED!`);
        console.warn(`   Current: ${mbPerHour.toFixed(2)}MB / ${this.config.maxMBPerHour}MB`);
        console.warn(`   Waiting ${Math.ceil(waitTime / 60000)} minutes for hourly window to reset...`);
        console.warn(`   This prevents hitting the 4,096MB suspension limit!\n`);
        await this.sleep(waitTime);
      }
    }

    // Check per-second limit
    const lastSecondRequests = this.getRequestsInWindow(now, 1000);
    if (lastSecondRequests >= this.config.maxRequestsPerSecond) {
      await this.sleep(1000);
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.delayBetweenRequests) {
      await this.sleep(this.config.delayBetweenRequests - timeSinceLastRequest);
    }
  }

  /**
   * Record a request with optional response size
   */
  recordRequest(responseBytes?: number): void {
    const now = Date.now();
    this.requests.push({ 
      timestamp: now,
      bytes: responseBytes || 0
    });
    this.lastRequestTime = now;
    
    if (responseBytes) {
      this.totalBytesDownloaded += responseBytes;
    }
  }

  /**
   * Get bandwidth used in a time window
   */
  private getBandwidthInWindow(now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    return this.requests
      .filter(r => r.timestamp > cutoff)
      .reduce((sum, r) => sum + (r.bytes || 0), 0);
  }

  /**
   * Get statistics
   */
  getStats() {
    const now = Date.now();
    const last24Hours = this.requests.length;
    const lastHour = this.getRequestsInWindow(now, 60 * 60 * 1000);
    const lastMinute = this.getRequestsInWindow(now, 60 * 1000);
    const lastSecond = this.getRequestsInWindow(now, 1000);

    // Bandwidth stats
    const bytesLastHour = this.getBandwidthInWindow(now, 60 * 60 * 1000);
    const mbLastHour = bytesLastHour / (1024 * 1024);
    
    const bytesLast24Hours = this.getBandwidthInWindow(now, 24 * 60 * 60 * 1000);
    const gbLast24Hours = bytesLast24Hours / (1024 * 1024 * 1024);

    const totalGB = this.totalBytesDownloaded / (1024 * 1024 * 1024);

    return {
      requests: {
        last24Hours,
        lastHour,
        lastMinute,
        lastSecond,
      },
      bandwidth: {
        mbLastHour: parseFloat(mbLastHour.toFixed(2)),
        gbLast24Hours: parseFloat(gbLast24Hours.toFixed(2)),
        totalGB: parseFloat(totalGB.toFixed(2)),
      },
      limits: {
        maxRequestsPerSecond: this.config.maxRequestsPerSecond,
        maxRequestsPerHour: this.config.maxRequestsPerHour,
        maxRequestsPer24Hours: this.config.maxRequestsPer24Hours,
        maxMBPerHour: this.config.maxMBPerHour,
        maxGBPer24Hours: this.config.maxGBPer24Hours,
      },
      percentages: {
        requestsHourly: parseFloat(((lastHour / this.config.maxRequestsPerHour) * 100).toFixed(2)),
        requestsDaily: parseFloat(((last24Hours / this.config.maxRequestsPer24Hours) * 100).toFixed(2)),
        bandwidthHourly: parseFloat(((mbLastHour / this.config.maxMBPerHour) * 100).toFixed(2)),
        bandwidthDaily: parseFloat(((gbLast24Hours / this.config.maxGBPer24Hours) * 100).toFixed(2)),
      },
      warnings: {
        requestsHourlyWarning: lastHour > this.config.maxRequestsPerHour * 0.8,
        requestsDailyWarning: last24Hours > this.config.maxRequestsPer24Hours * 0.8,
        bandwidthHourlyWarning: mbLastHour > this.config.maxMBPerHour * 0.8,
        bandwidthDailyWarning: gbLast24Hours > this.config.maxGBPer24Hours * 0.8,
      }
    };
  }

  /**
   * Clean requests older than 24 hours
   */
  private cleanOldRequests(now: number): void {
    const cutoff = now - 24 * 60 * 60 * 1000;
    this.requests = this.requests.filter(r => r.timestamp > cutoff);
  }

  /**
   * Get number of requests in time window
   */
  private getRequestsInWindow(now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    return this.requests.filter(r => r.timestamp > cutoff).length;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset(): void {
    this.requests = [];
    this.lastRequestTime = 0;
    this.totalBytesDownloaded = 0;
  }

  /**
   * Get warning status
   */
  getWarningStatus(): {
    hasWarning: boolean;
    warnings: string[];
  } {
    const stats = this.getStats();
    const warnings: string[] = [];

    if (stats.warnings.requestsHourlyWarning) {
      warnings.push(`Hourly requests at ${stats.percentages.requestsHourly}% (${stats.requests.lastHour}/${stats.limits.maxRequestsPerHour})`);
    }
    if (stats.warnings.requestsDailyWarning) {
      warnings.push(`Daily requests at ${stats.percentages.requestsDaily}% (${stats.requests.last24Hours}/${stats.limits.maxRequestsPer24Hours})`);
    }
    if (stats.warnings.bandwidthHourlyWarning) {
      warnings.push(`Hourly bandwidth at ${stats.percentages.bandwidthHourly}% (${stats.bandwidth.mbLastHour}MB/${stats.limits.maxMBPerHour}MB)`);
    }
    if (stats.warnings.bandwidthDailyWarning) {
      warnings.push(`Daily bandwidth at ${stats.percentages.bandwidthDaily}% (${stats.bandwidth.gbLast24Hours}GB/${stats.limits.maxGBPer24Hours}GB)`);
    }

    return {
      hasWarning: warnings.length > 0,
      warnings
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();