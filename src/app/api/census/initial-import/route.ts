// src/app/api/census/initial-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { censusClient } from '@/lib/census-client';
import { censusService } from '@services/census.service';
import { query } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface ImportResults {
  catalog: { created: number; updated: number; errors: number };
  metadata: { created: number; updated: number; errors: number };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const results: ImportResults = {
    catalog: { created: 0, updated: 0, errors: 0 },
    metadata: { created: 0, updated: 0, errors: 0 },
  };

  try {
    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const options = {
      fetchMetadata: body.fetchMetadata !== false, // default true
      maxDatasets: body.maxDatasets || null,
      startIndex: body.startIndex || 0,
      onlyAvailable: body.onlyAvailable !== false, // default true
      vintageFilter: body.vintageFilter || null, // e.g., [2020, 2021, 2022]
      batchSize: body.batchSize || 50,
    };

    console.log('========================================');
    console.log('Starting Census data import...');
    console.log('Options:', JSON.stringify(options, null, 2));
    console.log('========================================');

    // ============================================================
    // STEP 1: Import Catalog (all datasets metadata)
    // ============================================================
    console.log('\n[STEP 1/2] IMPORTING CENSUS CATALOG...');
    
    try {
      await censusClient.processDatasetsInBatches(
        async (batch) => {
          for (const dataset of batch) {
            try {
              const existing = await censusService.getDatasetByIdentifier(dataset.identifier);
              
              // Import without metadata first (just catalog info)
              await censusService.upsertDataset(dataset);
              
              if (existing) {
                results.catalog.updated++;
              } else {
                results.catalog.created++;
              }

              const total = results.catalog.created + results.catalog.updated;
              if (total % 100 === 0) {
                console.log(`  Progress: ${total} datasets processed`);
              }
            } catch (error: any) {
              console.error(`  Error: ${dataset.identifier} - ${error.message}`);
              results.catalog.errors++;
            }
          }
        },
        {
          batchSize: options.batchSize,
          maxDatasets: options.maxDatasets,
          startIndex: options.startIndex,
          onlyAvailable: options.onlyAvailable,
          vintageFilter: options.vintageFilter,
        }
      );
      
      console.log(`✓ Catalog Complete: ${results.catalog.created} created, ${results.catalog.updated} updated, ${results.catalog.errors} errors`);
    } catch (error: any) {
      console.error('✗ Error importing catalog:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 2: Fetch and Import Metadata (optional)
    // ============================================================
    if (options.fetchMetadata) {
      console.log('\n[STEP 2/2] FETCHING METADATA FOR DATASETS...');
      console.log('  This may take a while as we fetch geography, variables, tags, etc.');
      
      try {
        // Get datasets that need metadata
        const datasetsNeedingMetadata = await censusService.getDatasetsNeedingMetadataSync(
          options.maxDatasets || 1000
        );

        console.log(`  Found ${datasetsNeedingMetadata.length} datasets needing metadata sync`);

        if (datasetsNeedingMetadata.length > 0) {
          let processed = 0;
          const batchSize = 10; // Process 10 datasets at a time for metadata

          for (let i = 0; i < datasetsNeedingMetadata.length; i += batchSize) {
            const batch = datasetsNeedingMetadata.slice(i, Math.min(i + batchSize, datasetsNeedingMetadata.length));
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(datasetsNeedingMetadata.length / batchSize);

            console.log(`\n  Metadata Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} datasets...`);

            for (const dataset of batch) {
              try {
                // Build the dataset object from database record using stored links
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
                  console.log(`    ⚠️  No valid metadata links for ${dataset.title} (skipped)`);
                  processed++;
                  continue;
                }

                // Fetch metadata using the stored links
                const metadata = await censusClient.fetchAllMetadata(datasetObj);
                
                // Update database with metadata
                await censusService.updateMetadata(dataset.identifier, metadata);
                
                results.metadata.updated++;
                processed++;

                if (processed % 10 === 0) {
                  console.log(`    Progress: ${processed}/${datasetsNeedingMetadata.length} metadata synced`);
                }
              } catch (error: any) {
                console.error(`    Error fetching metadata for ${dataset.identifier}:`, error.message);
                results.metadata.errors++;
              }
            }

            // Small delay between batches
            if (i + batchSize < datasetsNeedingMetadata.length) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

          console.log(`  ✓ Metadata sync complete: ${results.metadata.updated} updated, ${results.metadata.errors} errors`);
        }
      } catch (error: any) {
        console.error('✗ Error fetching metadata:', error.message);
      }
    } else {
      console.log('\n[STEP 2/2] SKIPPING METADATA FETCH (disabled in options)');
    }

    // ============================================================
    // Log Results to Database
    // ============================================================
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const totalProcessed = results.catalog.created + results.catalog.updated;
    const totalCreated = results.catalog.created;
    const totalUpdated = results.catalog.updated;

    await query(
      `INSERT INTO census.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_failed,
        started_at, completed_at, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'datasets',
        'catalog',
        'completed',
        totalProcessed,
        totalCreated,
        totalUpdated,
        results.catalog.errors + results.metadata.errors,
        new Date(startTime),
        new Date(),
        duration,
      ]
    );

    // Get final statistics
    const stats = await censusService.getDatasetStats();

    console.log('\n========================================');
    console.log('✓ CENSUS IMPORT COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Duration: ${duration}s (${Math.floor(duration / 60)}m ${duration % 60}s)`);
    console.log(`\nCatalog Import:`);
    console.log(`  - Created: ${results.catalog.created}`);
    console.log(`  - Updated: ${results.catalog.updated}`);
    console.log(`  - Errors: ${results.catalog.errors}`);
    
    if (options.fetchMetadata) {
      console.log(`\nMetadata Sync:`);
      console.log(`  - Updated: ${results.metadata.updated}`);
      console.log(`  - Errors: ${results.metadata.errors}`);
    }

    console.log(`\nDatabase Statistics:`);
    console.log(`  - Total datasets: ${stats.total}`);
    console.log(`  - Available datasets: ${stats.available}`);
    console.log(`  - With metadata: ${stats.withMetadata}`);
    console.log(`\nDatasets by Vintage:`);
    stats.byVintage.slice(0, 10).forEach((v: any) => {
      console.log(`  - ${v.vintage || 'N/A'}: ${v.count}`);
    });
    console.log('========================================');

    // Log final client stats
    censusClient.logFinalStats();

    return NextResponse.json({
      success: true,
      message: 'Census data import completed',
      duration: `${duration}s`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      summary: {
        totalProcessed,
        totalCreated,
        totalUpdated,
        totalErrors: results.catalog.errors + results.metadata.errors,
      },
      results,
      stats,
      clientStats: censusClient.getStats(),
    });

  } catch (error: any) {
    console.error('\n========================================');
    console.error('✗ CENSUS IMPORT FAILED');
    console.error('========================================');
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    await query(
      `INSERT INTO census.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_failed,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'datasets',
        'catalog',
        'failed',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

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