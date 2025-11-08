// src/app/api/mls/sync-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mlsClient } from '@/lib/mls-client';
import { propertyService } from '@services/property.service';
import { memberService } from '@services/member.service';
import { officeService } from '@services/office.service';
import { openHouseService } from '@services/openhouse.service';
import { query } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  duration: string;
  error?: string;
  emergencyShutdown?: boolean;
}

// Global flag for emergency shutdown
let globalEmergencyShutdown = false;

// ============================================================
// STEP 1: Sync Offices (with Media)
// ============================================================
async function syncOffices(): Promise<SyncResult> {
  console.log('\n[STEP 1/4] Syncing offices (with media)...');
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;
  let emergencyShutdown = false;

  try {
    const lastSync = await officeService.getLastModificationTimestamp();
    
    let filter = 'MlgCanView eq true';
    if (lastSync) {
      const isoDate = lastSync.toISOString();
      filter = `ModificationTimestamp gt ${isoDate}`;
      console.log(`  Fetching offices modified after ${isoDate}`);
    }

    const response = await mlsClient.getOffices({
      filter,
      expand: 'Media',
      top: 200,
    });

    const offices = response.value || [];
    recordsProcessed = offices.length;
    console.log(`  Found ${recordsProcessed} offices to sync`);

    for (let i = 0; i < offices.length; i++) {
      if (globalEmergencyShutdown || emergencyShutdown) {
        console.log('  🛑 Emergency shutdown triggered. Stopping offices sync...');
        emergencyShutdown = true;
        break;
      }

      const office = offices[i];
      
      if ((i + 1) % 50 === 0) {
        console.log(`    Progress: ${i + 1}/${offices.length}`);
      }

      try {
        const existing = await officeService.getOfficeByKey(office.OfficeKey);

        if (office.MlgCanView) {
          await officeService.upsertOffice(office);
          if (existing) recordsUpdated++;
          else recordsCreated++;
        } else {
          if (existing) {
            await officeService.deleteOffice(office.OfficeKey);
            recordsDeleted++;
          }
        }
      } catch (error: any) {
        console.error(`    Error processing ${office.OfficeKey}:`, error.message);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (emergencyShutdown) {
      console.log(`  ⏸️  Offices sync paused: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    } else {
      console.log(`  ✓ Offices: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    }

    // Log to sync_logs
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Office',
        'incremental',
        emergencyShutdown ? 'paused' : 'success',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        new Date(startTime),
        new Date(),
        duration,
        emergencyShutdown ? 'Paused due to rate limit' : null,
      ]
    );

    return {
      success: !emergencyShutdown,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted,
      duration: `${duration}s`,
      emergencyShutdown,
    };
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (error.message.includes('Rate limit exceeded after')) {
      emergencyShutdown = true;
      globalEmergencyShutdown = true;
      console.error('  ✗ CRITICAL: Rate limit exhausted during offices sync');
    } else {
      console.error('  ✗ Error syncing offices:', error.message);
    }
    
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Office',
        'incremental',
        emergencyShutdown ? 'rate_limit_exceeded' : 'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      duration: `${duration}s`,
      error: error.message,
      emergencyShutdown,
    };
  }
}

// ============================================================
// STEP 2: Sync Members (with Media)
// ============================================================
async function syncMembers(): Promise<SyncResult> {
  console.log('\n[STEP 2/4] Syncing members (with media)...');
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;
  let emergencyShutdown = false;

  try {
    if (globalEmergencyShutdown) {
      console.log('  ⏭️  Skipping members sync due to previous emergency shutdown');
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        duration: '0s',
        emergencyShutdown: true,
      };
    }

    const lastSync = await memberService.getLastModificationTimestamp();
    
    let filter = 'MlgCanView eq true';
    if (lastSync) {
      const isoDate = lastSync.toISOString();
      filter = `ModificationTimestamp gt ${isoDate}`;
      console.log(`  Fetching members modified after ${isoDate}`);
    }

    const response = await mlsClient.getMembers({
      filter,
      expand: 'Media',
      top: 200,
    });

    const members = response.value || [];
    recordsProcessed = members.length;
    console.log(`  Found ${recordsProcessed} members to sync`);

    for (let i = 0; i < members.length; i++) {
      if (globalEmergencyShutdown || emergencyShutdown) {
        console.log('  🛑 Emergency shutdown triggered. Stopping members sync...');
        emergencyShutdown = true;
        break;
      }

      const member = members[i];
      
      if ((i + 1) % 50 === 0) {
        console.log(`    Progress: ${i + 1}/${members.length}`);
      }

      try {
        const existing = await memberService.getMemberByKey(member.MemberKey);

        if (member.MlgCanView) {
          await memberService.upsertMember(member);
          if (existing) recordsUpdated++;
          else recordsCreated++;
        } else {
          if (existing) {
            await memberService.deleteMember(member.MemberKey);
            recordsDeleted++;
          }
        }
      } catch (error: any) {
        console.error(`    Error processing ${member.MemberKey}:`, error.message);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (emergencyShutdown) {
      console.log(`  ⏸️  Members sync paused: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    } else {
      console.log(`  ✓ Members: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    }

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Member',
        'incremental',
        emergencyShutdown ? 'paused' : 'success',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        new Date(startTime),
        new Date(),
        duration,
        emergencyShutdown ? 'Paused due to rate limit' : null,
      ]
    );

    return {
      success: !emergencyShutdown,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted,
      duration: `${duration}s`,
      emergencyShutdown,
    };
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (error.message.includes('Rate limit exceeded after')) {
      emergencyShutdown = true;
      globalEmergencyShutdown = true;
      console.error('  ✗ CRITICAL: Rate limit exhausted during members sync');
    } else {
      console.error('  ✗ Error syncing members:', error.message);
    }
    
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Member',
        'incremental',
        emergencyShutdown ? 'rate_limit_exceeded' : 'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      duration: `${duration}s`,
      error: error.message,
      emergencyShutdown,
    };
  }
}

// ============================================================
// STEP 3: Sync Properties (with Media, Rooms, UnitTypes)
// ============================================================
async function syncProperties(): Promise<SyncResult> {
  console.log('\n[STEP 3/4] Syncing properties (Cook County, IL only - with media, rooms, units)...');
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;
  let emergencyShutdown = false;

  try {
    if (globalEmergencyShutdown) {
      console.log('  ⏭️  Skipping properties sync due to previous emergency shutdown');
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        duration: '0s',
        emergencyShutdown: true,
      };
    }

    const lastSync = await propertyService.getLastModificationTimestamp();
    
    let filter = 'MlgCanView eq true';
    if (lastSync) {
      const isoDate = lastSync.toISOString();
      filter = `ModificationTimestamp gt ${isoDate}`;
      console.log(`  Fetching properties modified after ${isoDate}`);
    }

    const response = await mlsClient.getProperties({
      filter,
      expand: 'Media,Rooms,UnitTypes',
      top: 200,
    });

    const allProperties = response.value || [];
    const properties = allProperties.filter((p: any) => 
      p.StateOrProvince === 'IL' && p.CountyOrParish === 'Cook'
    );
    
    recordsProcessed = properties.length;
    console.log(`  Fetched ${allProperties.length} total, filtered to ${recordsProcessed} (Cook County, IL)`);

    for (let i = 0; i < properties.length; i++) {
      if (globalEmergencyShutdown || emergencyShutdown) {
        console.log('  🛑 Emergency shutdown triggered. Stopping properties sync...');
        emergencyShutdown = true;
        break;
      }

      const property = properties[i];
      
      if ((i + 1) % 50 === 0) {
        console.log(`    Progress: ${i + 1}/${properties.length}`);
      }

      try {
        const existing = await propertyService.getPropertyByListingKey(property.ListingKey);

        if (property.MlgCanView) {
          await propertyService.upsertProperty(property);
          if (existing) recordsUpdated++;
          else recordsCreated++;
        } else {
          if (existing) {
            await propertyService.deleteProperty(property.ListingKey);
            recordsDeleted++;
          }
        }
      } catch (error: any) {
        console.error(`    Error processing ${property.ListingKey}:`, error.message);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (emergencyShutdown) {
      console.log(`  ⏸️  Properties sync paused: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    } else {
      console.log(`  ✓ Properties: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted (${duration}s)`);
    }

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Property',
        'incremental',
        emergencyShutdown ? 'paused' : 'success',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        new Date(startTime),
        new Date(),
        duration,
        emergencyShutdown ? 'Paused due to rate limit' : null,
      ]
    );

    return {
      success: !emergencyShutdown,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted,
      duration: `${duration}s`,
      emergencyShutdown,
    };
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (error.message.includes('Rate limit exceeded after')) {
      emergencyShutdown = true;
      globalEmergencyShutdown = true;
      console.error('  ✗ CRITICAL: Rate limit exhausted during properties sync');
    } else {
      console.error('  ✗ Error syncing properties:', error.message);
    }
    
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'Property',
        'incremental',
        emergencyShutdown ? 'rate_limit_exceeded' : 'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      duration: `${duration}s`,
      error: error.message,
      emergencyShutdown,
    };
  }
}

// ============================================================
// STEP 4: Sync OpenHouses
// ============================================================
async function syncOpenHouses(): Promise<SyncResult> {
  console.log('\n[STEP 4/4] Syncing open houses (Cook County, IL properties only)...');
  const startTime = Date.now();
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsDeleted = 0;
  let skippedCount = 0;
  let emergencyShutdown = false;

  try {
    if (globalEmergencyShutdown) {
      console.log('  ⏭️  Skipping open houses sync due to previous emergency shutdown');
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        duration: '0s',
        emergencyShutdown: true,
      };
    }

    const lastSync = await openHouseService.getLastModificationTimestamp();
    
    let filter = 'MlgCanView eq true';
    if (lastSync) {
      const isoDate = lastSync.toISOString();
      filter = `ModificationTimestamp gt ${isoDate}`;
      console.log(`  Fetching open houses modified after ${isoDate}`);
    }

    const response = await mlsClient.getOpenHouses({
      filter,
      top: 200,
    });

    const allOpenHouses = response.value || [];
    console.log(`  Fetched ${allOpenHouses.length} open houses`);

    for (let i = 0; i < allOpenHouses.length; i++) {
      if (globalEmergencyShutdown || emergencyShutdown) {
        console.log('  🛑 Emergency shutdown triggered. Stopping open houses sync...');
        emergencyShutdown = true;
        break;
      }

      const openHouse = allOpenHouses[i];
      
      if ((i + 1) % 50 === 0) {
        console.log(`    Progress: ${i + 1}/${allOpenHouses.length}`);
      }

      try {
        // Check if property exists in our DB (Cook County filter)
        if (openHouse.ListingKey) {
          const property = await propertyService.getPropertyByListingKey(openHouse.ListingKey);
          
          if (!property) {
            // Property not in our DB (not Cook County, IL)
            skippedCount++;
            continue;
          }
        }

        const existing = await openHouseService.getOpenHouseByKey(openHouse.OpenHouseKey);

        if (openHouse.MlgCanView) {
          await openHouseService.upsertOpenHouse(openHouse);
          if (existing) recordsUpdated++;
          else recordsCreated++;
          recordsProcessed++;
        } else {
          if (existing) {
            await openHouseService.deleteOpenHouse(openHouse.OpenHouseKey);
            recordsDeleted++;
            recordsProcessed++;
          }
        }
      } catch (error: any) {
        console.error(`    Error processing ${openHouse.OpenHouseKey}:`, error.message);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (emergencyShutdown) {
      console.log(`  ⏸️  Open houses sync paused: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted, ${skippedCount} skipped (${duration}s)`);
    } else {
      console.log(`  ✓ Open houses: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsDeleted} deleted, ${skippedCount} skipped (${duration}s)`);
    }

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'OpenHouse',
        'incremental',
        emergencyShutdown ? 'paused' : 'success',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsDeleted,
        new Date(startTime),
        new Date(),
        duration,
        emergencyShutdown ? 'Paused due to rate limit' : null,
      ]
    );

    return {
      success: !emergencyShutdown,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsDeleted,
      duration: `${duration}s`,
      emergencyShutdown,
    };
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (error.message.includes('Rate limit exceeded after')) {
      emergencyShutdown = true;
      globalEmergencyShutdown = true;
      console.error('  ✗ CRITICAL: Rate limit exhausted during open houses sync');
    } else {
      console.error('  ✗ Error syncing open houses:', error.message);
    }
    
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'OpenHouse',
        'incremental',
        emergencyShutdown ? 'rate_limit_exceeded' : 'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      duration: `${duration}s`,
      error: error.message,
      emergencyShutdown,
    };
  }
}

// ============================================================
// Main Sync Function
// ============================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Reset global emergency shutdown flag at start
  globalEmergencyShutdown = false;

  console.log('========================================');
  console.log('Starting sync for all resources...');
  console.log('Sync Order: Offices → Members → Properties → OpenHouses');
  console.log('Note: Media is synced with each parent resource (via expand)');
  console.log('⚠️  Conservative rate limits enabled to prevent suspension');
  console.log('========================================');

  try {
    const results = {
      offices: await syncOffices(),
      members: await syncMembers(),
      properties: await syncProperties(),
      openHouses: await syncOpenHouses(),
    };

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Calculate totals
    const totalProcessed = 
      results.offices.recordsProcessed +
      results.members.recordsProcessed +
      results.properties.recordsProcessed +
      results.openHouses.recordsProcessed;

    const totalCreated = 
      results.offices.recordsCreated +
      results.members.recordsCreated +
      results.properties.recordsCreated +
      results.openHouses.recordsCreated;

    const totalUpdated = 
      results.offices.recordsUpdated +
      results.members.recordsUpdated +
      results.properties.recordsUpdated +
      results.openHouses.recordsUpdated;

    const totalDeleted = 
      results.offices.recordsDeleted +
      results.members.recordsDeleted +
      results.properties.recordsDeleted +
      results.openHouses.recordsDeleted;

    const anyEmergencyShutdown = 
      results.offices.emergencyShutdown ||
      results.members.emergencyShutdown ||
      results.properties.emergencyShutdown ||
      results.openHouses.emergencyShutdown;

    // Log summary sync to database
    const status = anyEmergencyShutdown ? 'rate_limit_exceeded' : 'success';

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'All',
        'incremental',
        status,
        totalProcessed,
        totalCreated,
        totalUpdated,
        totalDeleted,
        new Date(startTime),
        new Date(),
        duration,
        anyEmergencyShutdown ? 'Sync paused due to rate limit exhaustion' : null,
      ]
    );

    if (anyEmergencyShutdown) {
      console.log('\n========================================');
      console.log('🚨 SYNC PAUSED DUE TO RATE LIMITS');
      console.log('========================================');
      console.log(`⏰ Please wait at least 65 minutes before resuming`);
      console.log(`📊 Progress saved:`);
      console.log(`   - Offices: ${results.offices.recordsCreated + results.offices.recordsUpdated} (${results.offices.recordsDeleted} deleted)`);
      console.log(`   - Members: ${results.members.recordsCreated + results.members.recordsUpdated} (${results.members.recordsDeleted} deleted)`);
      console.log(`   - Properties: ${results.properties.recordsCreated + results.properties.recordsUpdated} (${results.properties.recordsDeleted} deleted)`);
      console.log(`   - OpenHouses: ${results.openHouses.recordsCreated + results.openHouses.recordsUpdated} (${results.openHouses.recordsDeleted} deleted)`);
      console.log('========================================');
    } else {
      console.log('\n========================================');
      console.log('✓ SYNC COMPLETED SUCCESSFULLY');
      console.log('========================================');
      console.log(`Duration: ${duration}s (${Math.floor(duration / 60)}m ${duration % 60}s)`);
      console.log(`Total Records Processed: ${totalProcessed}`);
      console.log(`  - Created: ${totalCreated}`);
      console.log(`  - Updated: ${totalUpdated}`);
      console.log(`  - Deleted: ${totalDeleted}`);
      console.log('\nBreakdown by Resource (includes related data):');
      console.log(`  Offices:    ${results.offices.recordsCreated}C / ${results.offices.recordsUpdated}U / ${results.offices.recordsDeleted}D`);
      console.log(`  Members:    ${results.members.recordsCreated}C / ${results.members.recordsUpdated}U / ${results.members.recordsDeleted}D`);
      console.log(`  Properties: ${results.properties.recordsCreated}C / ${results.properties.recordsUpdated}U / ${results.properties.recordsDeleted}D`);
      console.log(`  OpenHouses: ${results.openHouses.recordsCreated}C / ${results.openHouses.recordsUpdated}U / ${results.openHouses.recordsDeleted}D`);
      console.log('========================================');
    }

    // Log final rate limit stats
    mlsClient.logFinalStats();

    return NextResponse.json({
      success: !anyEmergencyShutdown,
      message: anyEmergencyShutdown
        ? 'Sync paused due to rate limits. Please wait 65 minutes and restart.'
        : 'All resources synced successfully',
      emergencyShutdown: anyEmergencyShutdown,
      duration: `${duration}s`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      summary: {
        totalProcessed,
        totalCreated,
        totalUpdated,
        totalDeleted,
      },
      results,
      rateLimitStats: mlsClient.getRateLimitStats(),
    }, {
      status: anyEmergencyShutdown ? 429 : 200
    });
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    console.error('\n========================================');
    console.error('✗ SYNC FAILED');
    console.error('========================================');
    console.error('Error during sync-all:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================');

    // Log error to database
    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['All',
        'incremental',
        'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    // Log rate limit stats even on failure
    mlsClient.logFinalStats();

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: `${duration}s`,
        rateLimitStats: mlsClient.getRateLimitStats(),
      },
      { status: 500 }
    );
  }
}