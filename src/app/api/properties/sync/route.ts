import { NextRequest, NextResponse } from 'next/server';
import { mlsClient } from '@/lib/mls-client';
import { propertyService } from '@services/property.service';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;

  try {
    // Create sync log entry
    const syncLogResult = await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, started_at
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Property', 'incremental', 'running', new Date()]
    );
    const syncLogId = syncLogResult.rows[0].id;

    // Get last modification timestamp
    const lastSync = await propertyService.getLastModificationTimestamp();
    
    let filter = 'MlgCanView eq true';
    if (lastSync) {
      const isoDate = lastSync.toISOString();
      filter = `ModificationTimestamp gt ${isoDate}`;
    }

    // Fetch updated properties from MLS
    const response = await mlsClient.getProperties({
      filter,
      expand: 'Media,Rooms,UnitTypes',
      top: 500,
    });

    const properties = response.value || [];
    recordsProcessed = properties.length;

    // Process each property
    for (const mlsProperty of properties) {
      try {
        // Check if property exists
        const existingProperty = await propertyService.getPropertyByListingKey(
          mlsProperty.ListingKey
        );

        if (mlsProperty.MlgCanView) {
          // Upsert property
          await propertyService.upsertProperty(mlsProperty);
          
          if (existingProperty) {
            recordsUpdated++;
          } else {
            recordsCreated++;
          }
        } else {
          // Delete property if MlgCanView is false
          if (existingProperty) {
            await propertyService.deleteProperty(mlsProperty.ListingKey);
            recordsDeleted++;
          }
        }
      } catch (error) {
        console.error(`Error processing property ${mlsProperty.ListingKey}:`, error);
      }
    }

    // Update sync log
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await query(
      `UPDATE mls.sync_logs 
       SET status = $1, 
           records_processed = $2,
           records_created = $3,
           records_updated = $4,
           records_deleted = $5,
           last_modification_timestamp = $6,
           completed_at = $7,
           duration_seconds = $8
       WHERE id = $9`,
      [
        'completed',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        lastSync,
        new Date(),
        duration,
        syncLogId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Property sync completed',
      stats: {
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        duration: `${duration}s`,
      },
    });
  } catch (error: any) {
    console.error('Error syncing properties:', error);

    // Log error
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, 
        started_at, completed_at,
        records_processed, records_created, records_updated, records_deleted,
        error_message, duration_seconds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Property',
        'incremental',
        'failed',
        new Date(startTime),
        new Date(),
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        error.message,
        Math.floor((Date.now() - startTime) / 1000)
      ]
    );

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}