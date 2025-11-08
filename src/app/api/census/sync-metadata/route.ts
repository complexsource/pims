// src/app/api/census/sync-metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { censusClient } from '@/lib/census-client';
import { censusService } from '@services/census.service';
import { query } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface MetadataSyncResults {
  geography: number;
  variables: number;
  tags: number;
  examples: number;
  groups: number;
  sorts: number;
  errors: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const results: MetadataSyncResults = {
    geography: 0,
    variables: 0,
    tags: 0,
    examples: 0,
    groups: 0,
    sorts: 0,
    errors: 0,
  };

  try {
    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const options = {
      limit: body.limit || 100, // Max datasets to process
      batchSize: body.batchSize || 10, // Datasets per batch
      delayMs: body.delayMs || 2000, // Delay between batches
      specificDataset: body.identifier || null, // Sync specific dataset
    };

    console.log('========================================');
    console.log('Starting Census metadata sync...');
    console.log('Options:', JSON.stringify(options, null, 2));
    console.log('========================================');

    let datasetsToSync: any[] = [];

    // Get datasets that need metadata sync
    if (options.specificDataset) {
      console.log(`\n📊 Syncing metadata for specific dataset: ${options.specificDataset}`);
      const dataset = await censusService.getDatasetByIdentifier(options.specificDataset);
      if (dataset) {
        datasetsToSync = [dataset];
      } else {
        throw new Error(`Dataset not found: ${options.specificDataset}`);
      }
    } else {
      console.log(`\n📊 Finding datasets needing metadata sync (limit: ${options.limit})...`);
      datasetsToSync = await censusService.getDatasetsNeedingMetadataSync(options.limit);
      console.log(`  Found ${datasetsToSync.length} datasets needing metadata sync`);
    }

    if (datasetsToSync.length === 0) {
      console.log('  ✓ All datasets are up to date!');
      
      return NextResponse.json({
        success: true,
        message: 'No datasets need metadata sync',
        duration: '0s',
        results,
      });
    }

    // Process datasets in batches
    let processed = 0;
    const totalDatasets = datasetsToSync.length;

    for (let i = 0; i < datasetsToSync.length; i += options.batchSize) {
      const batch = datasetsToSync.slice(i, Math.min(i + options.batchSize, datasetsToSync.length));
      const batchNumber = Math.floor(i / options.batchSize) + 1;
      const totalBatches = Math.ceil(datasetsToSync.length / options.batchSize);

      console.log(`\n📥 Metadata Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} datasets...`);

      for (const dataset of batch) {
        try {
          console.log(`  📊 [${processed + 1}/${totalDatasets}] ${dataset.title}`);

          // Build the dataset object from database record
          const datasetObj = {
            identifier: dataset.identifier,
            title: dataset.title,
            c_geographyLink: dataset.geography_link,
            c_variablesLink: dataset.variables_link,
            c_tagsLink: dataset.tags_link,
            c_examplesLink: dataset.examples_link,
            c_groupsLink: dataset.groups_link,
            c_sorts_url: dataset.sorts_link,
          };

          // Check if there are any actual metadata links (not just identifier URLs)
          const hasValidLinks = [
            dataset.geography_link,
            dataset.variables_link,
            dataset.tags_link,
            dataset.examples_link,
            dataset.groups_link,
            dataset.sorts_link
          ].some(link => {
            if (!link) return false;
            // Valid links should NOT be identifier URLs
            return !link.includes('/data/id/');
          });

          if (!hasValidLinks) {
            console.log(`    ⚠️  No valid metadata links available for this dataset (skipped)`);
            processed++;
            continue;
          }

          // Fetch metadata
          const metadata = await censusClient.fetchAllMetadata(datasetObj);

          // Count what was fetched
          if (metadata.geography) results.geography++;
          if (metadata.variables) results.variables++;
          if (metadata.tags) results.tags++;
          if (metadata.examples) results.examples++;
          if (metadata.groups) results.groups++;
          if (metadata.sorts) results.sorts++;

          // Update database
          await censusService.updateMetadata(dataset.identifier, metadata);

          processed++;

          const metadataCount = Object.values(metadata).filter(m => m !== null).length;
          console.log(`    ✓ Fetched ${metadataCount}/6 metadata types`);

        } catch (error: any) {
          console.error(`    ✗ Error: ${error.message}`);
          results.errors++;
        }
      }

      // Delay between batches (be nice to Census API)
      if (i + options.batchSize < datasetsToSync.length) {
        console.log(`    ⏳ Waiting ${options.delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, options.delayMs));
      }
    }

    // ============================================================
    // Log Results to Database
    // ============================================================
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const totalMetadataFetched = 
      results.geography + results.variables + results.tags +
      results.examples + results.groups + results.sorts;

    await query(
      `INSERT INTO census.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_failed,
        started_at, completed_at, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'metadata', // ✅ Fixed: use 'metadata' as resource type
        'incremental',
        'completed',
        processed,
        0,
        totalMetadataFetched,
        results.errors,
        new Date(startTime),
        new Date(),
        duration,
      ]
    );

    console.log('\n========================================');
    console.log('✓ METADATA SYNC COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Duration: ${duration}s (${Math.floor(duration / 60)}m ${duration % 60}s)`);
    console.log(`Datasets processed: ${processed}`);
    console.log(`\nMetadata fetched:`);
    console.log(`  - Geography: ${results.geography}`);
    console.log(`  - Variables: ${results.variables}`);
    console.log(`  - Tags: ${results.tags}`);
    console.log(`  - Examples: ${results.examples}`);
    console.log(`  - Groups: ${results.groups}`);
    console.log(`  - Sorts: ${results.sorts}`);
    console.log(`  - Errors: ${results.errors}`);
    console.log('========================================');

    // Log final client stats
    censusClient.logFinalStats();

    return NextResponse.json({
      success: true,
      message: `Metadata sync completed for ${processed} datasets`,
      duration: `${duration}s`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      summary: {
        datasetsProcessed: processed,
        totalMetadataFetched,
        errors: results.errors,
      },
      results,
      clientStats: censusClient.getStats(),
    });

  } catch (error: any) {
    console.error('\n========================================');
    console.error('✗ METADATA SYNC FAILED');
    console.error('========================================');
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    try {
      await query(
        `INSERT INTO census.sync_logs (
          resource_type, sync_type, status, records_processed,
          records_created, records_updated, records_failed,
          started_at, completed_at, duration_seconds, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          'metadata', // ✅ Fixed: use 'metadata' as resource type
          'incremental',
          'failed',
          0, 0, 0, results.errors,
          new Date(startTime),
          new Date(),
          duration,
          error.message,
        ]
      );
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    censusClient.logFinalStats();

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        results,
        clientStats: censusClient.getStats(),
      },
      { status: 500 }
    );
  }
}