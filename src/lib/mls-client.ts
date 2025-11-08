// src/lib/mls-client.ts
import { rateLimiter } from './rate-limiter';

const MLS_API_URL = process.env.MLS_API_URL || 'https://api.mlsgrid.com/v2';
const MLS_API_TOKEN = process.env.MLS_API_TOKEN || '';

export interface MLSRequestOptions {
  filter?: string;
  expand?: string;
  top?: number;
  skip?: number;
  select?: string;
  orderby?: string;
}

export interface BatchProcessOptions {
  batchSize?: number;
  maxPages?: number;
  filterByLocation?: boolean;
}

export class MLSClient {
  private baseUrl: string;
  private token: string;
  private requestCount: number = 0;
  private sessionStartTime: number = Date.now();
  private isPaused: boolean = false;
  private pauseUntil: number = 0;

  constructor() {
    this.baseUrl = MLS_API_URL;
    this.token = MLS_API_TOKEN;
    
    if (!this.token) {
      console.warn('⚠️  MLS_API_TOKEN is not set!');
    }
  }

  private buildUrl(resource: string, options?: MLSRequestOptions): string {
    const url = new URL(`${this.baseUrl}/${resource}`);
    
    if (options?.filter) {
      url.searchParams.append('$filter', options.filter);
    }
    if (options?.expand) {
      url.searchParams.append('$expand', options.expand);
    }
    if (options?.top) {
      url.searchParams.append('$top', options.top.toString());
    }
    if (options?.skip) {
      url.searchParams.append('$skip', options.skip.toString());
    }
    if (options?.select) {
      url.searchParams.append('$select', options.select);
    }
    if (options?.orderby) {
      url.searchParams.append('$orderby', options.orderby);
    }

    return url.toString();
  }

  /**
   * Pause all operations until a specific time
   */
  pauseOperations(durationMs: number): void {
    this.isPaused = true;
    this.pauseUntil = Date.now() + durationMs;
    
    const minutes = Math.ceil(durationMs / 60000);
    console.log(`\n⏸️  OPERATIONS PAUSED FOR ${minutes} MINUTES`);
    console.log(`   Resume time: ${new Date(this.pauseUntil).toLocaleString()}\n`);
  }

  /**
   * Check if operations are paused and wait if necessary
   */
  private async checkPauseStatus(): Promise<void> {
    if (this.isPaused) {
      const now = Date.now();
      if (now < this.pauseUntil) {
        const remainingMs = this.pauseUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        console.log(`⏸️  Operations still paused. ${remainingMinutes} minutes remaining...`);
        await this.sleep(remainingMs);
        this.isPaused = false;
        console.log('▶️  Operations resumed!');
      } else {
        this.isPaused = false;
        console.log('▶️  Pause period ended. Resuming operations...');
      }
    }
  }

  /**
   * Calculate wait time for bandwidth limit
   */
  private calculateBandwidthWaitTime(): number {
    const stats = rateLimiter.getStats();
    
    // Wait for the full hourly window to reset plus buffer
    const waitTime = (65 * 60 * 1000); // 65 minutes
    
    console.warn(`\n🚨 BANDWIDTH LIMIT CRITICAL:`);
    console.warn(`   Current: ${stats.bandwidth.mbLastHour}MB`);
    console.warn(`   Our Limit: ${stats.limits.maxMBPerHour}MB`);
    console.warn(`   MLS Warning: 3,072MB`);
    console.warn(`   MLS Suspension: 4,096MB`);
    console.warn(`   Action: Pausing for ${Math.ceil(waitTime / 60000)} minutes to let hourly window reset\n`);
    
    return waitTime;
  }

  /**
   * Calculate wait time for request limit
   */
  private calculateRequestWaitTime(): number {
    const stats = rateLimiter.getStats();
    
    // Wait for the hourly window to reset plus buffer
    const waitTime = (65 * 60 * 1000); // 65 minutes
    
    console.warn(`\n⚠️  REQUEST LIMIT CRITICAL:`);
    console.warn(`   Current: ${stats.requests.lastHour}`);
    console.warn(`   Our Limit: ${stats.limits.maxRequestsPerHour}`);
    console.warn(`   MLS Warning: 7,200`);
    console.warn(`   Action: Pausing for ${Math.ceil(waitTime / 60000)} minutes\n`);
    
    return waitTime;
  }

  private async request<T>(url: string, retryCount: number = 0): Promise<T> {
    // Check if operations are paused
    await this.checkPauseStatus();

    // Wait if rate limit is reached
    await rateLimiter.waitIfNeeded();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response size from Content-Length header
      const contentLength = response.headers.get('content-length');
      const responseBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle rate limit errors (429)
        if (response.status === 429) {
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // If parsing fails, use the raw text
          }

          // Parse the error message to understand which limit was hit
          const errorMessage = errorData?.error?.details?.[0]?.message || errorData?.error?.message || errorText;
          
          console.error('\n' + '='.repeat(70));
          console.error('🚨 RATE LIMIT EXCEEDED - API RETURNED 429');
          console.error('='.repeat(70));
          console.error(`Error: ${errorMessage}`);
          console.error(`Retry Attempt: ${retryCount + 1}`);
          
          // Determine wait time based on the error and retry count
          let waitTime = 60000; // Default 60 seconds
          
          // Check if it's a bandwidth limit
          if (errorMessage.includes('MB') || errorMessage.includes('GB') || errorMessage.includes('downloaded')) {
            // Bandwidth limit hit - need to wait for the hourly window to reset
            waitTime = this.calculateBandwidthWaitTime();
          } else if (errorMessage.includes('requests')) {
            // Request count limit hit
            waitTime = this.calculateRequestWaitTime();
          } else {
            // Unknown limit - use exponential backoff
            waitTime = Math.min(60000 * Math.pow(2, retryCount), 3600000); // Max 1 hour
            console.error(`🕐 Unknown rate limit. Using exponential backoff: ${Math.ceil(waitTime / 60000)} minutes...`);
          }

          // Show current stats
          const stats = rateLimiter.getStats();
          console.error('\n📊 Current Usage:');
          console.error(`   Bandwidth/Hour: ${stats.bandwidth.mbLastHour}MB / ${stats.limits.maxMBPerHour}MB (${stats.percentages.bandwidthHourly}%)`);
          console.error(`   Requests/Hour: ${stats.requests.lastHour} / ${stats.limits.maxRequestsPerHour} (${stats.percentages.requestsHourly}%)`);
          console.error('='.repeat(70) + '\n');

          // Maximum retry attempts
          if (retryCount >= 5) {
            console.error('❌ Maximum retry attempts reached. Aborting...');
            throw new Error(`Rate limit exceeded after ${retryCount} retries: ${errorMessage}`);
          }

          // Pause operations
          this.pauseOperations(waitTime);

          // Wait and retry
          await this.sleep(waitTime);
          console.log(`🔄 Retrying request (attempt ${retryCount + 2})...`);
          return this.request<T>(url, retryCount + 1);
        }
        
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`MLS API Error: ${response.status} - ${errorText}`);
      }

      // Record successful request with bandwidth
      rateLimiter.recordRequest(responseBytes);
      this.requestCount++;

      // Log stats every 100 requests
      if (this.requestCount % 100 === 0) {
        this.logRateLimitStats();
      }

      // Check for warnings every 50 requests
      if (this.requestCount % 50 === 0) {
        const warningStatus = rateLimiter.getWarningStatus();
        if (warningStatus.hasWarning) {
          console.warn('\n⚠️  RATE LIMIT WARNINGS:');
          warningStatus.warnings.forEach(w => console.warn(`   - ${w}`));
          console.warn('');
        }
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timeout after 60 seconds');
        throw new Error('MLS API request timed out');
      }
      console.error('MLS API Request Error:', error.message);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logRateLimitStats(): void {
    const stats = rateLimiter.getStats();
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    console.log('\n📊 Rate Limit Stats:');
    console.log(`   Session: ${this.requestCount} requests in ${sessionDuration}s`);
    console.log(`   Requests:`);
    console.log(`     - Last Second: ${stats.requests.lastSecond}/${stats.limits.maxRequestsPerSecond}`);
    console.log(`     - Last Hour: ${stats.requests.lastHour}/${stats.limits.maxRequestsPerHour} (${stats.percentages.requestsHourly}%)`);
    console.log(`     - Last 24h: ${stats.requests.last24Hours}/${stats.limits.maxRequestsPer24Hours} (${stats.percentages.requestsDaily}%)`);
    console.log(`   Bandwidth:`);
    console.log(`     - Last Hour: ${stats.bandwidth.mbLastHour}MB/${stats.limits.maxMBPerHour}MB (${stats.percentages.bandwidthHourly}%)`);
    console.log(`     - Last 24h: ${stats.bandwidth.gbLast24Hours}GB/${stats.limits.maxGBPer24Hours}GB (${stats.percentages.bandwidthDaily}%)`);
    console.log(`     - Total Session: ${stats.bandwidth.totalGB}GB`);
  }

  // ============================================================
  // Resource-specific methods
  // ============================================================

  async getProperties(options?: MLSRequestOptions) {
    const url = this.buildUrl('Property', options);
    return this.request<any>(url);
  }

  async getMembers(options?: MLSRequestOptions) {
    const url = this.buildUrl('Member', options);
    return this.request<any>(url);
  }

  async getOffices(options?: MLSRequestOptions) {
    const url = this.buildUrl('Office', options);
    return this.request<any>(url);
  }

  async getOpenHouses(options?: MLSRequestOptions) {
    const url = this.buildUrl('OpenHouse', options);
    return this.request<any>(url);
  }

  async getMedia(options?: MLSRequestOptions) {
    const url = this.buildUrl('Media', options);
    return this.request<any>(url);
  }

  // ============================================================
  // Batch Processing Methods
  // ============================================================

  async processPropertiesInBatches(
    callback: (batch: any[]) => Promise<void>,
    options?: BatchProcessOptions
  ): Promise<number> {
    console.log('\n🏠 Processing properties in batches...');
    
    const batchSize = options?.batchSize || 1000;
    const maxPages = options?.maxPages;
    let totalProcessed = 0;
    let totalFetched = 0;
    let pageCount = 0;

    try {
      const filter = 'MlgCanView eq true';
      
      const firstResponse = await this.getProperties({
        filter,
        expand: 'Media,Rooms,UnitTypes',
        top: batchSize,
      });

      if (firstResponse.value && firstResponse.value.length > 0) {
        totalFetched += firstResponse.value.length;
        
        const filteredBatch = options?.filterByLocation 
          ? firstResponse.value.filter((p: any) => 
              p.StateOrProvince === 'IL' && p.CountyOrParish === 'Cook'
            )
          : firstResponse.value;
        
        if (filteredBatch.length > 0) {
          await callback(filteredBatch);
          totalProcessed += filteredBatch.length;
        }
        pageCount++;
        console.log(`   Page ${pageCount}: Fetched ${firstResponse.value.length}, Processed ${filteredBatch.length}, Total: ${totalProcessed}`);
      }

      let nextLink = firstResponse['@odata.nextLink'];

      while (nextLink) {
        if (maxPages && pageCount >= maxPages) {
          console.log(`   ⏸️  Stopped at ${maxPages} pages limit`);
          break;
        }

        const response = await this.request<any>(nextLink);
        
        if (response.value && response.value.length > 0) {
          totalFetched += response.value.length;
          
          const filteredBatch = options?.filterByLocation
            ? response.value.filter((p: any) => 
                p.StateOrProvince === 'IL' && p.CountyOrParish === 'Cook'
              )
            : response.value;
          
          if (filteredBatch.length > 0) {
            await callback(filteredBatch);
            totalProcessed += filteredBatch.length;
          }
          pageCount++;
          console.log(`   Page ${pageCount}: Fetched ${response.value.length}, Processed ${filteredBatch.length}, Total: ${totalProcessed}`);
        }

        nextLink = response['@odata.nextLink'];
      }

      console.log(`   ✓ Completed: ${totalProcessed} properties processed out of ${totalFetched} fetched`);
      return totalProcessed;
    } catch (error: any) {
      console.error(`   ✗ Error during batch processing:`, error.message);
      throw error;
    }
  }

  async processMembersInBatches(
    callback: (batch: any[]) => Promise<void>,
    options?: BatchProcessOptions
  ): Promise<number> {
    console.log('\n👥 Processing members in batches...');
    
    const batchSize = options?.batchSize || 1000;
    const maxPages = options?.maxPages;
    let totalProcessed = 0;
    let pageCount = 0;

    try {
      const firstResponse = await this.getMembers({
        filter: 'MlgCanView eq true',
        expand: 'Media',
        top: batchSize,
      });

      if (firstResponse.value && firstResponse.value.length > 0) {
        await callback(firstResponse.value);
        totalProcessed += firstResponse.value.length;
        pageCount++;
        console.log(`   Page ${pageCount}: Processed ${firstResponse.value.length}, Total: ${totalProcessed}`);
      }

      let nextLink = firstResponse['@odata.nextLink'];

      while (nextLink) {
        if (maxPages && pageCount >= maxPages) {
          console.log(`   ⏸️  Stopped at ${maxPages} pages limit`);
          break;
        }

        const response = await this.request<any>(nextLink);
        
        if (response.value && response.value.length > 0) {
          await callback(response.value);
          totalProcessed += response.value.length;
          pageCount++;
          console.log(`   Page ${pageCount}: Processed ${response.value.length}, Total: ${totalProcessed}`);
        }

        nextLink = response['@odata.nextLink'];
      }

      console.log(`   ✓ Completed: ${totalProcessed} members processed`);
      return totalProcessed;
    } catch (error: any) {
      console.error(`   ✗ Error during batch processing:`, error.message);
      throw error;
    }
  }

  async processOfficesInBatches(
    callback: (batch: any[]) => Promise<void>,
    options?: BatchProcessOptions
  ): Promise<number> {
    console.log('\n🏢 Processing offices in batches...');
    
    const batchSize = options?.batchSize || 1000;
    const maxPages = options?.maxPages;
    let totalProcessed = 0;
    let pageCount = 0;

    try {
      const firstResponse = await this.getOffices({
        filter: 'MlgCanView eq true',
        expand: 'Media',
        top: batchSize,
      });

      if (firstResponse.value && firstResponse.value.length > 0) {
        await callback(firstResponse.value);
        totalProcessed += firstResponse.value.length;
        pageCount++;
        console.log(`   Page ${pageCount}: Processed ${firstResponse.value.length}, Total: ${totalProcessed}`);
      }

      let nextLink = firstResponse['@odata.nextLink'];

      while (nextLink) {
        if (maxPages && pageCount >= maxPages) {
          console.log(`   ⏸️  Stopped at ${maxPages} pages limit`);
          break;
        }

        const response = await this.request<any>(nextLink);
        
        if (response.value && response.value.length > 0) {
          await callback(response.value);
          totalProcessed += response.value.length;
          pageCount++;
          console.log(`   Page ${pageCount}: Processed ${response.value.length}, Total: ${totalProcessed}`);
        }

        nextLink = response['@odata.nextLink'];
      }

      console.log(`   ✓ Completed: ${totalProcessed} offices processed`);
      return totalProcessed;
    } catch (error: any) {
      console.error(`   ✗ Error during batch processing:`, error.message);
      throw error;
    }
  }

  async processOpenHousesInBatches(
    callback: (batch: any[]) => Promise<void>,
    options?: BatchProcessOptions
  ): Promise<number> {
    console.log('\n🚪 Processing open houses in batches...');
    
    const batchSize = options?.batchSize || 1000;
    const maxPages = options?.maxPages;
    let totalProcessed = 0;
    let pageCount = 0;

    try {
      const firstResponse = await this.getOpenHouses({
        filter: 'MlgCanView eq true',
        top: batchSize,
      });

      if (firstResponse.value && firstResponse.value.length > 0) {
        await callback(firstResponse.value);
        totalProcessed += firstResponse.value.length;
        pageCount++;
        console.log(`   Page ${pageCount}: Processed ${firstResponse.value.length}, Total: ${totalProcessed}`);
      }

      let nextLink = firstResponse['@odata.nextLink'];

      while (nextLink) {
        if (maxPages && pageCount >= maxPages) {
          console.log(`   ⏸️  Stopped at ${maxPages} pages limit`);
          break;
        }

        const response = await this.request<any>(nextLink);
        
        if (response.value && response.value.length > 0) {
          await callback(response.value);
          totalProcessed += response.value.length;
          pageCount++;
          console.log(`   Page ${pageCount}: Processed ${response.value.length}, Total: ${totalProcessed}`);
        }

        nextLink = response['@odata.nextLink'];
      }

      console.log(`   ✓ Completed: ${totalProcessed} open houses processed`);
      return totalProcessed;
    } catch (error: any) {
      console.error(`   ✗ Error during batch processing:`, error.message);
      throw error;
    }
  }

  /**
   * Get current rate limit statistics
   */
  getRateLimitStats() {
    const stats = rateLimiter.getStats();
    const warningStatus = rateLimiter.getWarningStatus();
    
    return {
      sessionRequests: this.requestCount,
      sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      requests: stats.requests,
      bandwidth: stats.bandwidth,
      limits: stats.limits,
      percentages: stats.percentages,
      warnings: stats.warnings,
      warningMessages: warningStatus.warnings,
      hasWarning: warningStatus.hasWarning,
    };
  }

  /**
   * Log final statistics
   */
  logFinalStats(): void {
    const stats = rateLimiter.getStats();
    const warningStatus = rateLimiter.getWarningStatus();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SESSION STATISTICS');
    console.log('='.repeat(60));
    
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    
    console.log(`\n🕐 Session Duration: ${minutes}m ${seconds}s`);
    console.log(`📨 Total Requests: ${this.requestCount}`);
    console.log(`💾 Total Data Downloaded: ${stats.bandwidth.totalGB}GB`);
    
    console.log('\n📊 Current Usage:');
    console.log(`   Requests:`);
    console.log(`     - Last Hour: ${stats.requests.lastHour}/${stats.limits.maxRequestsPerHour} (${stats.percentages.requestsHourly}%)`);
    console.log(`     - Last 24h: ${stats.requests.last24Hours}/${stats.limits.maxRequestsPer24Hours} (${stats.percentages.requestsDaily}%)`);
    console.log(`   Bandwidth:`);
    console.log(`     - Last Hour: ${stats.bandwidth.mbLastHour}MB/${stats.limits.maxMBPerHour}MB (${stats.percentages.bandwidthHourly}%)`);
    console.log(`     - Last 24h: ${stats.bandwidth.gbLast24Hours}GB/${stats.limits.maxGBPer24Hours}GB (${stats.percentages.bandwidthDaily}%)`);
    
    console.log('\n⚠️  Warning Thresholds (80%):');
    console.log(`   Requests/Hour: ${stats.warnings.requestsHourlyWarning ? '⚠️  EXCEEDED' : '✅ OK'}`);
    console.log(`   Requests/Day: ${stats.warnings.requestsDailyWarning ? '⚠️  EXCEEDED' : '✅ OK'}`);
    console.log(`   Bandwidth/Hour: ${stats.warnings.bandwidthHourlyWarning ? '⚠️  EXCEEDED' : '✅ OK'}`);
    console.log(`   Bandwidth/Day: ${stats.warnings.bandwidthDailyWarning ? '⚠️  EXCEEDED' : '✅ OK'}`);
    
    if (warningStatus.hasWarning) {
      console.log('\n⚠️  ACTIVE WARNINGS:');
      warningStatus.warnings.forEach(w => console.log(`   - ${w}`));
    } else {
      console.log('\n✅ All rate limits within safe thresholds');
    }
    
    console.log('\n📋 MLS Grid Limits Reference:');
    console.log(`   Warning Limits:`);
    console.log(`     - 7,200 requests/hour`);
    console.log(`     - 40,000 requests/day`);
    console.log(`     - 3,072 MB/hour`);
    console.log(`     - 40 GB/day`);
    console.log(`     - 4 requests/second`);
    console.log(`   Suspension Limits:`);
    console.log(`     - 18,000 requests/hour`);
    console.log(`     - 60,000 requests/day`);
    console.log(`     - 4,096 MB/hour ⚠️`);
    console.log(`     - 60 GB/day`);
    console.log(`     - 6 requests/second`);
    
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Reset session counters (for testing)
   */
  resetSession(): void {
    this.requestCount = 0;
    this.sessionStartTime = Date.now();
    this.isPaused = false;
    this.pauseUntil = 0;
    rateLimiter.reset();
  }
}

export const mlsClient = new MLSClient();