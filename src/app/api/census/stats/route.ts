// src/app/api/census/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { censusService } from '@services/census.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching Census database statistics...');

    // Get dataset statistics
    const datasetStats = await censusService.getDatasetStats();

    // Get sync statistics
    const syncStatsResult = await query(
      `SELECT 
        resource_type,
        sync_type,
        COUNT(*) as total_syncs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(records_processed) as total_processed,
        SUM(records_created) as total_created,
        SUM(records_updated) as total_updated,
        MAX(started_at) as last_sync
       FROM census.sync_logs
       GROUP BY resource_type, sync_type
       ORDER BY resource_type, sync_type`
    );

    // Get recent sync logs
    const recentSyncsResult = await query(
      `SELECT 
        id, resource_type, sync_type, status,
        records_processed, records_created, records_updated, records_failed,
        started_at, completed_at, duration_seconds, error_message
       FROM census.sync_logs
       ORDER BY started_at DESC
       LIMIT 10`
    );

    // Get metadata sync progress
    const metadataProgressResult = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN geography_synced THEN 1 ELSE 0 END) as geography_synced,
        SUM(CASE WHEN variables_synced THEN 1 ELSE 0 END) as variables_synced,
        SUM(CASE WHEN tags_synced THEN 1 ELSE 0 END) as tags_synced,
        SUM(CASE WHEN examples_synced THEN 1 ELSE 0 END) as examples_synced,
        SUM(CASE WHEN groups_synced THEN 1 ELSE 0 END) as groups_synced,
        SUM(CASE WHEN sorts_synced THEN 1 ELSE 0 END) as sorts_synced
       FROM census.datasets
       WHERE is_available = true`
    );

    // Get datasets needing metadata sync
    const needingSyncResult = await query(
      `SELECT COUNT(*) as count
       FROM census.datasets
       WHERE is_available = true
         AND (
           (geography_link IS NOT NULL AND geography_synced = false) OR
           (variables_link IS NOT NULL AND variables_synced = false) OR
           (tags_link IS NOT NULL AND tags_synced = false) OR
           (examples_link IS NOT NULL AND examples_synced = false) OR
           (groups_link IS NOT NULL AND groups_synced = false) OR
           (sorts_link IS NOT NULL AND sorts_synced = false)
         )`
    );

    // Get cached data statistics
    const cacheStatsResult = await query(
      `SELECT 
        COUNT(*) as total_cached,
        SUM(response_size_bytes) as total_size_bytes,
        COUNT(CASE WHEN cache_expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_cache,
        COUNT(CASE WHEN cache_expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_cache
       FROM census.census_data
       WHERE is_cached = true`
    );

    const metadataProgress = metadataProgressResult.rows[0];
    const cacheStats = cacheStatsResult.rows[0];
    const totalAvailable = parseInt(metadataProgress?.total || '0');

    console.log('✓ Statistics fetched successfully');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      datasets: {
        total: datasetStats.total,
        available: datasetStats.available,
        withMetadata: datasetStats.withMetadata,
        byVintage: datasetStats.byVintage,
        needingMetadataSync: parseInt(needingSyncResult.rows[0]?.count || '0'),
      },
      metadataSync: {
        total: totalAvailable,
        geography: {
          synced: parseInt(metadataProgress?.geography_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.geography_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
        variables: {
          synced: parseInt(metadataProgress?.variables_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.variables_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
        tags: {
          synced: parseInt(metadataProgress?.tags_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.tags_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
        examples: {
          synced: parseInt(metadataProgress?.examples_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.examples_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
        groups: {
          synced: parseInt(metadataProgress?.groups_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.groups_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
        sorts: {
          synced: parseInt(metadataProgress?.sorts_synced || '0'),
          percentage: totalAvailable > 0 
            ? ((parseInt(metadataProgress?.sorts_synced || '0') / totalAvailable) * 100).toFixed(1)
            : '0',
        },
      },
      cache: {
        totalCached: parseInt(cacheStats?.total_cached || '0'),
        activeCache: parseInt(cacheStats?.active_cache || '0'),
        expiredCache: parseInt(cacheStats?.expired_cache || '0'),
        totalSizeMB: ((parseInt(cacheStats?.total_size_bytes || '0')) / (1024 * 1024)).toFixed(2),
      },
      syncHistory: {
        summary: syncStatsResult.rows,
        recentSyncs: recentSyncsResult.rows,
      },
    });

  } catch (error: any) {
    console.error('✗ Error fetching statistics:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
      },
      { status: 500 }
    );
  }
}