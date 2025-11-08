// src/lib/census-client.ts

const CENSUS_API_URL = 'https://api.census.gov/data';
const CENSUS_CATALOG_URL = 'https://api.census.gov/data.json';

export interface CensusDataset {
  identifier: string;
  title: string;
  description?: string;
  c_vintage?: number;
  c_dataset?: string[];
  c_geographyLink?: string;
  c_variablesLink?: string;
  c_tagsLink?: string;
  c_examplesLink?: string;
  c_groupsLink?: string;
  c_sorts_url?: string;
  c_documentationLink?: string;
  c_isMicrodata?: boolean;
  c_isCube?: boolean;
  c_isAggregate?: boolean;
  c_isAvailable?: boolean;
  accessLevel?: string;
  modified?: string;
  contactPoint?: any;
  publisher?: any;
  keyword?: string[];
  license?: string;
  bureauCode?: string[];
  programCode?: string[];
  references?: string[];
  spatial?: string;
  temporal?: string;
  distribution?: any[];
  [key: string]: any;
}

export interface CensusCatalogResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  dataset: CensusDataset[];
}

export interface BatchProcessOptions {
  batchSize?: number;
  maxDatasets?: number;
  startIndex?: number;
  onlyAvailable?: boolean;
  vintageFilter?: number[];
}

export class CensusClient {
  private catalogUrl: string;
  private baseUrl: string;
  private requestCount: number = 0;
  private sessionStartTime: number = Date.now();

  constructor() {
    this.catalogUrl = CENSUS_CATALOG_URL;
    this.baseUrl = CENSUS_API_URL;
  }

  /**
   * Fetch the complete Census catalog
   */
  async getCatalog(): Promise<CensusCatalogResponse> {
    console.log(`\n📥 Fetching Census catalog from ${this.catalogUrl}...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(this.catalogUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Census API Error (${response.status}):`, errorText);
        throw new Error(`Census API Error: ${response.status} - ${errorText}`);
      }

      this.requestCount++;
      const data = await response.json();
      
      console.log(`✓ Catalog fetched successfully`);
      console.log(`  Total datasets in catalog: ${data.dataset?.length || 0}`);
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timeout after 60 seconds');
        throw new Error('Census API request timed out');
      }
      console.error('Census API Request Error:', error.message);
      throw error;
    }
  }

  /**
   * Fetch JSON data from a specific URL
   */
  async fetchJson<T = any>(url: string, description?: string): Promise<T | null> {
    if (!url) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`  ⚠️  Failed to fetch ${description || url}: ${response.status}`);
        return null;
      }

      this.requestCount++;
      return response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`  ⚠️  Timeout fetching ${description || url}`);
      } else {
        console.warn(`  ⚠️  Error fetching ${description || url}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch geography data for a dataset
   */
  async fetchGeographyData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'geography data');
  }

  /**
   * Fetch variables data for a dataset
   */
  async fetchVariablesData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'variables data');
  }

  /**
   * Fetch tags data for a dataset
   */
  async fetchTagsData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'tags data');
  }

  /**
   * Fetch examples data for a dataset
   */
  async fetchExamplesData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'examples data');
  }

  /**
   * Fetch groups data for a dataset
   */
  async fetchGroupsData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'groups data');
  }

  /**
   * Fetch sorts data for a dataset
   */
  async fetchSortsData(url: string): Promise<any | null> {
    return this.fetchJson(url, 'sorts data');
  }

  /**
   * Fetch all metadata for a dataset
   */
  async fetchAllMetadata(dataset: CensusDataset): Promise<{
    geography: any | null;
    variables: any | null;
    tags: any | null;
    examples: any | null;
    groups: any | null;
    sorts: any | null;
  }> {
    console.log(`  📥 Fetching metadata for: ${dataset.title}`);

    const [geography, variables, tags, examples, groups, sorts] = await Promise.all([
      dataset.c_geographyLink ? this.fetchGeographyData(dataset.c_geographyLink) : Promise.resolve(null),
      dataset.c_variablesLink ? this.fetchVariablesData(dataset.c_variablesLink) : Promise.resolve(null),
      dataset.c_tagsLink ? this.fetchTagsData(dataset.c_tagsLink) : Promise.resolve(null),
      dataset.c_examplesLink ? this.fetchExamplesData(dataset.c_examplesLink) : Promise.resolve(null),
      dataset.c_groupsLink ? this.fetchGroupsData(dataset.c_groupsLink) : Promise.resolve(null),
      dataset.c_sorts_url ? this.fetchSortsData(dataset.c_sorts_url) : Promise.resolve(null),
    ]);

    const metadataCount = [geography, variables, tags, examples, groups, sorts].filter(d => d !== null).length;
    console.log(`    ✓ Fetched ${metadataCount}/6 metadata types`);

    return { geography, variables, tags, examples, groups, sorts };
  }

  /**
   * Process datasets in batches
   */
  async processDatasetsInBatches(
    callback: (batch: CensusDataset[]) => Promise<void>,
    options?: BatchProcessOptions
  ): Promise<number> {
    console.log('\n📊 Processing Census datasets in batches...');
    
    const batchSize = options?.batchSize || 50;
    const maxDatasets = options?.maxDatasets;
    const startIndex = options?.startIndex || 0;
    const onlyAvailable = options?.onlyAvailable !== false; // default true
    
    let totalProcessed = 0;

    try {
      // Fetch catalog
      const catalog = await this.getCatalog();
      let datasets = catalog.dataset || [];

      // Apply filters
      if (onlyAvailable) {
        datasets = datasets.filter(d => d.c_isAvailable !== false);
        console.log(`  Filtered to ${datasets.length} available datasets`);
      }

      if (options?.vintageFilter && options.vintageFilter.length > 0) {
        datasets = datasets.filter(d => 
          d.c_vintage && options.vintageFilter!.includes(d.c_vintage)
        );
        console.log(`  Filtered to ${datasets.length} datasets for vintages: ${options.vintageFilter.join(', ')}`);
      }

      // Apply start index
      if (startIndex > 0) {
        datasets = datasets.slice(startIndex);
        console.log(`  Starting from index ${startIndex}, ${datasets.length} datasets remaining`);
      }

      // Apply max limit
      if (maxDatasets && maxDatasets > 0) {
        datasets = datasets.slice(0, maxDatasets);
        console.log(`  Limited to first ${maxDatasets} datasets`);
      }

      console.log(`\n  Processing ${datasets.length} datasets in batches of ${batchSize}...`);

      // Process in batches
      for (let i = 0; i < datasets.length; i += batchSize) {
        const batch = datasets.slice(i, Math.min(i + batchSize, datasets.length));
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(datasets.length / batchSize);

        console.log(`\n  Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} datasets...`);

        await callback(batch);
        totalProcessed += batch.length;

        console.log(`    ✓ Batch ${batchNumber} complete. Total processed: ${totalProcessed}`);

        // Small delay between batches
        if (i + batchSize < datasets.length) {
          await this.sleep(1000);
        }
      }

      console.log(`\n  ✓ Completed: ${totalProcessed} datasets processed`);
      return totalProcessed;
    } catch (error: any) {
      console.error(`  ✗ Error during batch processing:`, error.message);
      throw error;
    }
  }

  /**
   * Process metadata for datasets in batches
   */
  async processMetadataInBatches(
    datasets: CensusDataset[],
    callback: (dataset: CensusDataset, metadata: any) => Promise<void>,
    options?: { batchSize?: number; delayMs?: number }
  ): Promise<number> {
    const batchSize = options?.batchSize || 10;
    const delayMs = options?.delayMs || 500;
    let totalProcessed = 0;

    console.log(`\n  📥 Fetching metadata for ${datasets.length} datasets...`);

    for (let i = 0; i < datasets.length; i += batchSize) {
      const batch = datasets.slice(i, Math.min(i + batchSize, datasets.length));
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(datasets.length / batchSize);

      console.log(`    Metadata Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} datasets...`);

      for (const dataset of batch) {
        try {
          const metadata = await this.fetchAllMetadata(dataset);
          await callback(dataset, metadata);
          totalProcessed++;
        } catch (error: any) {
          console.error(`      ✗ Error processing metadata for ${dataset.identifier}:`, error.message);
        }
      }

      // Delay between batches to be respectful to API
      if (i + batchSize < datasets.length) {
        await this.sleep(delayMs);
      }
    }

    console.log(`    ✓ Metadata processing complete: ${totalProcessed} datasets`);
    return totalProcessed;
  }

  /**
   * Query census data from a dataset
   */
  async queryCensusData(
    datasetPath: string,
    params: Record<string, string>
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}/${datasetPath}`);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`  📊 Querying census data: ${url.toString()}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const startTime = Date.now();
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Census Data API Error: ${response.status} - ${errorText}`);
      }

      this.requestCount++;
      const data = await response.json();

      console.log(`    ✓ Data received (${responseTime}ms, ${data.length || 0} rows)`);

      return {
        data,
        responseTime,
        responseSize: JSON.stringify(data).length,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Census data query timed out');
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current session statistics
   */
  getStats() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    return {
      sessionRequests: this.requestCount,
      sessionDuration,
      requestsPerSecond: sessionDuration > 0 ? (this.requestCount / sessionDuration).toFixed(2) : '0',
    };
  }

  /**
   * Log final statistics
   */
  logFinalStats(): void {
    const stats = this.getStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CENSUS CLIENT SESSION STATISTICS');
    console.log('='.repeat(60));
    
    const minutes = Math.floor(parseInt(stats.sessionDuration.toString()) / 60);
    const seconds = parseInt(stats.sessionDuration.toString()) % 60;
    
    console.log(`\n🕐 Session Duration: ${minutes}m ${seconds}s`);
    console.log(`📨 Total Requests: ${stats.sessionRequests}`);
    console.log(`⚡ Avg Requests/Second: ${stats.requestsPerSecond}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Reset session counters
   */
  resetSession(): void {
    this.requestCount = 0;
    this.sessionStartTime = Date.now();
  }
}

export const censusClient = new CensusClient();