// src/services/census.service.ts
import { query } from '@/lib/db';
import { CensusDataset } from '@/lib/census-client';

export interface DatasetRecord {
  id: string;
  identifier: string;
  title: string;
  vintage?: number;
  dataset_path?: string[];
  is_available: boolean;
  last_synced_at?: Date;
  geography_synced: boolean;
  variables_synced: boolean;
  tags_synced: boolean;
}

class CensusService {
  /**
   * Upsert a dataset from catalog
   */
  async upsertDataset(dataset: CensusDataset, metadata?: any): Promise<void> {
    try {
      // Extract contact information
      const contactName = dataset.contactPoint?.fn || null;
      let contactEmail = dataset.contactPoint?.hasEmail || null;
      if (contactEmail) {
        // Remove all mailto: prefixes (sometimes there are duplicates)
        contactEmail = contactEmail.replace(/mailto:/gi, '').trim();
      }

      // Extract distribution info
      const distribution = dataset.distribution?.[0];
      const distributionFormat = distribution?.format || null;
      const distributionMediaType = distribution?.mediaType || null;

      // Get API endpoint from distribution
      const apiEndpoint = distribution?.accessURL || null;

      const values = [
        dataset.identifier,
        dataset.title,
        dataset.c_vintage || null,
        dataset.c_dataset || null,
        dataset.c_isMicrodata || false,
        dataset.c_isCube || false,
        dataset.c_isAggregate || false,
        dataset.c_isAvailable !== false, // default true
        apiEndpoint,
        dataset.c_geographyLink || null,
        dataset.c_variablesLink || null,
        dataset.c_tagsLink || null,
        dataset.c_examplesLink || null,
        dataset.c_groupsLink || null,
        dataset.c_sorts_url || null,
        dataset.c_documentationLink || null,
        dataset.description || null,
        dataset.keyword || null,
        dataset.accessLevel || null,
        dataset.modified ? new Date(dataset.modified) : null,
        contactName,
        contactEmail,
        distributionFormat,
        distributionMediaType,
        dataset.spatial || null,
        dataset.temporal || null,
        dataset.license || null,
        dataset.bureauCode || null,
        dataset.programCode || null,
        dataset.references || null, // Will be stored in reference_urls column
        JSON.stringify(dataset), // raw_metadata
        dataset.publisher ? JSON.stringify(dataset.publisher) : null,
        dataset.contactPoint ? JSON.stringify(dataset.contactPoint) : null,
        // Metadata (if provided)
        metadata?.geography ? JSON.stringify(metadata.geography) : null,
        metadata?.variables ? JSON.stringify(metadata.variables) : null,
        metadata?.tags ? JSON.stringify(metadata.tags) : null,
        metadata?.examples ? JSON.stringify(metadata.examples) : null,
        metadata?.groups ? JSON.stringify(metadata.groups) : null,
        metadata?.sorts ? JSON.stringify(metadata.sorts) : null,
        // Sync status flags
        metadata?.geography !== undefined,
        metadata?.variables !== undefined,
        metadata?.tags !== undefined,
        metadata?.examples !== undefined,
        metadata?.groups !== undefined,
        metadata?.sorts !== undefined,
      ];

      await query(
        `INSERT INTO census.datasets (
          identifier, title, vintage, dataset_path,
          is_microdata, is_cube, is_aggregate, is_available,
          api_endpoint, geography_link, variables_link, tags_link,
          examples_link, groups_link, sorts_link, documentation_link,
          description, keywords, access_level, modified_date,
          contact_name, contact_email,
          distribution_format, distribution_media_type,
          spatial, temporal, license,
          bureau_code, program_code, reference_urls,
          raw_metadata, publisher_data, contact_point_data,
          geography_data, variables_data, tags_data,
          examples_data, groups_data, sorts_data,
          geography_synced, variables_synced, tags_synced,
          examples_synced, groups_synced, sorts_synced,
          last_synced_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, CURRENT_TIMESTAMP
        )
        ON CONFLICT (identifier) DO UPDATE SET
          title = EXCLUDED.title,
          vintage = EXCLUDED.vintage,
          dataset_path = EXCLUDED.dataset_path,
          is_microdata = EXCLUDED.is_microdata,
          is_cube = EXCLUDED.is_cube,
          is_aggregate = EXCLUDED.is_aggregate,
          is_available = EXCLUDED.is_available,
          api_endpoint = EXCLUDED.api_endpoint,
          geography_link = EXCLUDED.geography_link,
          variables_link = EXCLUDED.variables_link,
          tags_link = EXCLUDED.tags_link,
          examples_link = EXCLUDED.examples_link,
          groups_link = EXCLUDED.groups_link,
          sorts_link = EXCLUDED.sorts_link,
          documentation_link = EXCLUDED.documentation_link,
          description = EXCLUDED.description,
          keywords = EXCLUDED.keywords,
          access_level = EXCLUDED.access_level,
          modified_date = EXCLUDED.modified_date,
          contact_name = EXCLUDED.contact_name,
          contact_email = EXCLUDED.contact_email,
          distribution_format = EXCLUDED.distribution_format,
          distribution_media_type = EXCLUDED.distribution_media_type,
          spatial = EXCLUDED.spatial,
          temporal = EXCLUDED.temporal,
          license = EXCLUDED.license,
          bureau_code = EXCLUDED.bureau_code,
          program_code = EXCLUDED.program_code,
          reference_urls = EXCLUDED.reference_urls,
          raw_metadata = EXCLUDED.raw_metadata,
          publisher_data = EXCLUDED.publisher_data,
          contact_point_data = EXCLUDED.contact_point_data,
          geography_data = COALESCE(EXCLUDED.geography_data, census.datasets.geography_data),
          variables_data = COALESCE(EXCLUDED.variables_data, census.datasets.variables_data),
          tags_data = COALESCE(EXCLUDED.tags_data, census.datasets.tags_data),
          examples_data = COALESCE(EXCLUDED.examples_data, census.datasets.examples_data),
          groups_data = COALESCE(EXCLUDED.groups_data, census.datasets.groups_data),
          sorts_data = COALESCE(EXCLUDED.sorts_data, census.datasets.sorts_data),
          geography_synced = EXCLUDED.geography_synced OR census.datasets.geography_synced,
          variables_synced = EXCLUDED.variables_synced OR census.datasets.variables_synced,
          tags_synced = EXCLUDED.tags_synced OR census.datasets.tags_synced,
          examples_synced = EXCLUDED.examples_synced OR census.datasets.examples_synced,
          groups_synced = EXCLUDED.groups_synced OR census.datasets.groups_synced,
          sorts_synced = EXCLUDED.sorts_synced OR census.datasets.sorts_synced,
          last_synced_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        `,
        values
      );
    } catch (error: any) {
      console.error(`Error upserting dataset ${dataset.identifier}:`, error.message);
      throw error;
    }
  }

  /**
   * Update metadata for an existing dataset
   */
  async updateMetadata(
    identifier: string,
    metadata: {
      geography?: any;
      variables?: any;
      tags?: any;
      examples?: any;
      groups?: any;
      sorts?: any;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (metadata.geography !== undefined) {
      updates.push(`geography_data = $${paramIndex++}`);
      updates.push(`geography_synced = true`);
      values.push(JSON.stringify(metadata.geography));
    }

    if (metadata.variables !== undefined) {
      updates.push(`variables_data = $${paramIndex++}`);
      updates.push(`variables_synced = true`);
      values.push(JSON.stringify(metadata.variables));
    }

    if (metadata.tags !== undefined) {
      updates.push(`tags_data = $${paramIndex++}`);
      updates.push(`tags_synced = true`);
      values.push(JSON.stringify(metadata.tags));
    }

    if (metadata.examples !== undefined) {
      updates.push(`examples_data = $${paramIndex++}`);
      updates.push(`examples_synced = true`);
      values.push(JSON.stringify(metadata.examples));
    }

    if (metadata.groups !== undefined) {
      updates.push(`groups_data = $${paramIndex++}`);
      updates.push(`groups_synced = true`);
      values.push(JSON.stringify(metadata.groups));
    }

    if (metadata.sorts !== undefined) {
      updates.push(`sorts_data = $${paramIndex++}`);
      updates.push(`sorts_synced = true`);
      values.push(JSON.stringify(metadata.sorts));
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    updates.push(`last_synced_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(identifier);

    await query(
      `UPDATE census.datasets SET ${updates.join(', ')} WHERE identifier = $${paramIndex}`,
      values
    );
  }

  /**
   * Get dataset by identifier
   */
  async getDatasetByIdentifier(identifier: string): Promise<DatasetRecord | null> {
    const result = await query(
      `SELECT id, identifier, title, vintage, dataset_path, is_available,
              last_synced_at, geography_synced, variables_synced, tags_synced
       FROM census.datasets
       WHERE identifier = $1`,
      [identifier]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all datasets that need metadata sync
   */
  async getDatasetsNeedingMetadataSync(limit: number = 100): Promise<any[]> {
    const result = await query(
      `SELECT id, identifier, title, vintage, dataset_path, is_available,
              last_synced_at, geography_synced, variables_synced, tags_synced,
              geography_link, variables_link, tags_link,
              examples_link, groups_link, sorts_link,
              examples_synced, groups_synced, sorts_synced
       FROM census.datasets
       WHERE is_available = true
         AND (
           (geography_link IS NOT NULL AND geography_synced = false) OR
           (variables_link IS NOT NULL AND variables_synced = false) OR
           (tags_link IS NOT NULL AND tags_synced = false) OR
           (examples_link IS NOT NULL AND examples_synced = false) OR
           (groups_link IS NOT NULL AND groups_synced = false) OR
           (sorts_link IS NOT NULL AND sorts_synced = false)
         )
       ORDER BY vintage DESC NULLS LAST, created_at
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats(): Promise<{
    total: number;
    available: number;
    withMetadata: number;
    byVintage: Array<{ vintage: number | null; count: number }>;
  }> {
    const totalResult = await query(
      'SELECT COUNT(*) as count FROM census.datasets'
    );

    const availableResult = await query(
      'SELECT COUNT(*) as count FROM census.datasets WHERE is_available = true'
    );

    const withMetadataResult = await query(
      `SELECT COUNT(*) as count FROM census.datasets 
       WHERE geography_synced = true OR variables_synced = true OR tags_synced = true`
    );

    const vintageResult = await query(
      `SELECT vintage, COUNT(*) as count 
       FROM census.datasets 
       WHERE is_available = true
       GROUP BY vintage 
       ORDER BY vintage DESC NULLS LAST`
    );

    return {
      total: parseInt(totalResult.rows[0]?.count || '0'),
      available: parseInt(availableResult.rows[0]?.count || '0'),
      withMetadata: parseInt(withMetadataResult.rows[0]?.count || '0'),
      byVintage: vintageResult.rows.map((row: any) => ({
        vintage: row.vintage,
        count: parseInt(row.count),
      })),
    };
  }

  /**
   * Search datasets
   */
  async searchDatasets(searchTerm: string, limit: number = 50): Promise<DatasetRecord[]> {
    const result = await query(
      `SELECT id, identifier, title, vintage, dataset_path, is_available,
              last_synced_at, geography_synced, variables_synced, tags_synced
       FROM census.datasets
       WHERE is_available = true
         AND (
           title ILIKE $1
           OR description ILIKE $1
           OR $2 = ANY(keywords)
         )
       ORDER BY vintage DESC NULLS LAST, title
       LIMIT $3`,
      [`%${searchTerm}%`, searchTerm, limit]
    );

    return result.rows;
  }

  /**
   * Store census data query result
   */
  async storeCensusData(
    datasetId: string,
    queryParams: Record<string, any>,
    apiResponse: any,
    options?: {
      geographyLevel?: string;
      geographyCode?: string;
      dataYear?: number;
      responseTime?: number;
      cacheExpiresDays?: number;
    }
  ): Promise<void> {
    const queryJson = JSON.stringify(queryParams);
    const queryHash = require('crypto').createHash('md5').update(queryJson).digest('hex');
    const responseSize = JSON.stringify(apiResponse).length;
    const cacheExpires = options?.cacheExpiresDays
      ? new Date(Date.now() + options.cacheExpiresDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    await query(
      `INSERT INTO census.census_data (
        dataset_id, query_params, query_hash,
        geography_level, geography_code, data_year,
        api_response, response_size_bytes, response_time_ms,
        cache_expires_at, is_cached
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (query_hash) DO UPDATE SET
        api_response = EXCLUDED.api_response,
        response_size_bytes = EXCLUDED.response_size_bytes,
        response_time_ms = EXCLUDED.response_time_ms,
        cache_expires_at = EXCLUDED.cache_expires_at,
        updated_at = CURRENT_TIMESTAMP`,
      [
        datasetId,
        queryJson,
        queryHash,
        options?.geographyLevel || null,
        options?.geographyCode || null,
        options?.dataYear || null,
        JSON.stringify(apiResponse),
        responseSize,
        options?.responseTime || null,
        cacheExpires,
        true,
      ]
    );
  }

  /**
   * Get cached census data
   */
  async getCachedCensusData(queryParams: Record<string, any>): Promise<any | null> {
    const queryJson = JSON.stringify(queryParams);
    const queryHash = require('crypto').createHash('md5').update(queryJson).digest('hex');

    const result = await query(
      `SELECT api_response, created_at, cache_expires_at
       FROM census.census_data
       WHERE query_hash = $1
         AND is_cached = true
         AND cache_expires_at > CURRENT_TIMESTAMP`,
      [queryHash]
    );

    if (result.rows[0]) {
      return {
        data: result.rows[0].api_response,
        cachedAt: result.rows[0].created_at,
        expiresAt: result.rows[0].cache_expires_at,
      };
    }

    return null;
  }

  /**
   * Clean expired cache
   */
  async cleanExpiredCache(): Promise<number> {
    const result = await query(
      `DELETE FROM census.census_data
       WHERE is_cached = true
         AND cache_expires_at < CURRENT_TIMESTAMP`
    );

    return result.rowCount || 0;
  }
}

export const censusService = new CensusService();