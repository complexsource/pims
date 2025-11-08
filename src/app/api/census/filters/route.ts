// src/app/api/census/filters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/filters
 * Get all available filter options for building filter UIs
 */
export async function GET(request: NextRequest) {
  try {
    // Get all unique vintages
    const vintagesResult = await query(
      `SELECT DISTINCT vintage 
       FROM census.datasets 
       WHERE is_available = true AND vintage IS NOT NULL
       ORDER BY vintage DESC`
    );

    // Get all unique dataset paths
    const datasetPathsResult = await query(
      `SELECT DISTINCT unnest(dataset_path) as path, COUNT(*) as count
       FROM census.datasets
       WHERE is_available = true
       GROUP BY path
       ORDER BY count DESC, path`
    );

    // Get all unique keywords
    const keywordsResult = await query(
      `SELECT DISTINCT unnest(keywords) as keyword, COUNT(*) as count
       FROM census.datasets
       WHERE is_available = true AND keywords IS NOT NULL
       GROUP BY keyword
       ORDER BY count DESC, keyword
       LIMIT 100`
    );

    // Get all unique tags from tags_data
    const tagsResult = await query(
      `SELECT DISTINCT jsonb_array_elements_text(tags_data->'tags') as tag, COUNT(*) as count
       FROM census.datasets
       WHERE is_available = true AND tags_data IS NOT NULL
       GROUP BY tag
       ORDER BY count DESC, tag
       LIMIT 100`
    );

    // Get dataset type counts
    const typesResult = await query(
      `SELECT 
        SUM(CASE WHEN is_microdata THEN 1 ELSE 0 END) as microdata_count,
        SUM(CASE WHEN is_cube THEN 1 ELSE 0 END) as cube_count,
        SUM(CASE WHEN is_aggregate THEN 1 ELSE 0 END) as aggregate_count
       FROM census.datasets
       WHERE is_available = true`
    );

    // Get metadata sync status counts
    const syncStatusResult = await query(
      `SELECT 
        COUNT(*) as total_datasets,
        SUM(CASE WHEN geography_synced THEN 1 ELSE 0 END) as with_geography,
        SUM(CASE WHEN variables_synced THEN 1 ELSE 0 END) as with_variables,
        SUM(CASE WHEN tags_synced THEN 1 ELSE 0 END) as with_tags,
        SUM(CASE WHEN geography_synced AND variables_synced THEN 1 ELSE 0 END) as fully_synced
       FROM census.datasets
       WHERE is_available = true`
    );

    // Get vintage ranges
    const vintageRangeResult = await query(
      `SELECT 
        MIN(vintage) as min_vintage,
        MAX(vintage) as max_vintage
       FROM census.datasets
       WHERE is_available = true AND vintage IS NOT NULL`
    );

    return NextResponse.json({
      success: true,
      filters: {
        vintages: {
          available: vintagesResult.rows.map(r => r.vintage),
          range: {
            min: vintageRangeResult.rows[0]?.min_vintage,
            max: vintageRangeResult.rows[0]?.max_vintage,
          },
        },
        dataset_paths: datasetPathsResult.rows.map(r => ({
          path: r.path,
          count: parseInt(r.count),
        })),
        keywords: keywordsResult.rows.map(r => ({
          keyword: r.keyword,
          count: parseInt(r.count),
        })),
        tags: tagsResult.rows.map(r => ({
          tag: r.tag,
          count: parseInt(r.count),
        })),
        types: {
          microdata: parseInt(typesResult.rows[0]?.microdata_count || '0'),
          cube: parseInt(typesResult.rows[0]?.cube_count || '0'),
          aggregate: parseInt(typesResult.rows[0]?.aggregate_count || '0'),
        },
        metadata_availability: {
          total: parseInt(syncStatusResult.rows[0]?.total_datasets || '0'),
          with_geography: parseInt(syncStatusResult.rows[0]?.with_geography || '0'),
          with_variables: parseInt(syncStatusResult.rows[0]?.with_variables || '0'),
          with_tags: parseInt(syncStatusResult.rows[0]?.with_tags || '0'),
          fully_synced: parseInt(syncStatusResult.rows[0]?.fully_synced || '0'),
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}