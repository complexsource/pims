// src/app/api/mls/initial-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mlsClient } from '@/lib/mls-client';
import { propertyService } from '@services/property.service';
import { memberService } from '@services/member.service';
import { officeService } from '@services/office.service';
import { openHouseService } from '@services/openhouse.service';
import { query } from '@/lib/db';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface ImportResults {
  offices: { created: number; updated: number; errors: number };
  members: { created: number; updated: number; errors: number };
  properties: { created: number; updated: number; errors: number };
  openHouses: { created: number; updated: number; errors: number; skipped: number };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const results: ImportResults = {
    offices: { created: 0, updated: 0, errors: 0 },
    members: { created: 0, updated: 0, errors: 0 },
    properties: { created: 0, updated: 0, errors: 0 },
    openHouses: { created: 0, updated: 0, errors: 0, skipped: 0 },
  };

  let emergencyShutdown = false;

  try {
    console.log('========================================');
    console.log('Starting initial MLS data import (Cook County, IL only)...');
    console.log('Processing Order: Offices → Members → Properties → OpenHouses');
    console.log('Note: Media is imported with each parent resource (via expand)');
    console.log('⚠️  Conservative rate limits enabled to prevent suspension');
    console.log('========================================');

    // ============================================================
    // STEP 1: Import Offices (with Media via expand)
    // ============================================================
    console.log('\n[STEP 1/4] IMPORTING OFFICES (with media)...');
    try {
      await mlsClient.processOfficesInBatches(
        async (batch) => {
          if (emergencyShutdown) {
            console.log('🛑 Emergency shutdown triggered. Stopping offices import...');
            return;
          }

          for (const office of batch) {
            try {
              const existing = await officeService.getOfficeByKey(office.OfficeKey);
              await officeService.upsertOffice(office);
              
              if (existing) {
                results.offices.updated++;
              } else {
                results.offices.created++;
              }

              const total = results.offices.created + results.offices.updated;
              if (total % 100 === 0) {
                console.log(`  Progress: ${total} offices processed`);
              }
            } catch (error: any) {
              console.error(`  Error: ${office.OfficeKey} - ${error.message}`);
              results.offices.errors++;
            }
          }
        },
        { batchSize: 500 }
      );
      
      if (!emergencyShutdown) {
        console.log(`✓ Offices Complete: ${results.offices.created} created, ${results.offices.updated} updated, ${results.offices.errors} errors`);
      }
    } catch (error: any) {
      if (error.message.includes('Rate limit exceeded after')) {
        emergencyShutdown = true;
        console.error('✗ CRITICAL: Rate limit exhausted during offices import');
      } else {
        console.error('✗ Error importing offices:', error.message);
      }
    }

    // ============================================================
    // STEP 2: Import Members (with Media via expand)
    // ============================================================
    if (!emergencyShutdown) {
      console.log('\n[STEP 2/4] IMPORTING MEMBERS (with media)...');
      try {
        await mlsClient.processMembersInBatches(
          async (batch) => {
            if (emergencyShutdown) {
              console.log('🛑 Emergency shutdown triggered. Stopping members import...');
              return;
            }

            for (const member of batch) {
              try {
                const existing = await memberService.getMemberByKey(member.MemberKey);
                await memberService.upsertMember(member);
                
                if (existing) {
                  results.members.updated++;
                } else {
                  results.members.created++;
                }

                const total = results.members.created + results.members.updated;
                if (total % 100 === 0) {
                  console.log(`  Progress: ${total} members processed`);
                }
              } catch (error: any) {
                console.error(`  Error: ${member.MemberKey} - ${error.message}`);
                results.members.errors++;
              }
            }
          },
          { batchSize: 500 }
        );
        
        if (!emergencyShutdown) {
          console.log(`✓ Members Complete: ${results.members.created} created, ${results.members.updated} updated, ${results.members.errors} errors`);
        }
      } catch (error: any) {
        if (error.message.includes('Rate limit exceeded after')) {
          emergencyShutdown = true;
          console.error('✗ CRITICAL: Rate limit exhausted during members import');
        } else {
          console.error('✗ Error importing members:', error.message);
        }
      }
    }

    // ============================================================
    // STEP 3: Import Properties (with Media, Rooms, UnitTypes via expand)
    // ============================================================
    if (!emergencyShutdown) {
      console.log('\n[STEP 3/4] IMPORTING PROPERTIES (Cook County, IL only - with media, rooms, units)...');
      try {
        await mlsClient.processPropertiesInBatches(
          async (batch) => {
            if (emergencyShutdown) {
              console.log('🛑 Emergency shutdown triggered. Stopping properties import...');
              return;
            }

            for (const property of batch) {
              try {
                const existing = await propertyService.getPropertyByListingKey(property.ListingKey);
                await propertyService.upsertProperty(property);
                
                if (existing) {
                  results.properties.updated++;
                } else {
                  results.properties.created++;
                }

                const total = results.properties.created + results.properties.updated;
                if (total % 100 === 0) {
                  console.log(`  Progress: ${total} properties processed`);
                }
              } catch (error: any) {
                console.error(`  Error: ${property.ListingKey} - ${error.message}`);
                results.properties.errors++;
              }
            }
          },
          { 
            batchSize: 1000,
            filterByLocation: true
          }
        );
        
        if (!emergencyShutdown) {
          console.log(`✓ Properties Complete: ${results.properties.created} created, ${results.properties.updated} updated, ${results.properties.errors} errors`);
        }
      } catch (error: any) {
        if (error.message.includes('Rate limit exceeded after')) {
          emergencyShutdown = true;
          console.error('✗ CRITICAL: Rate limit exhausted during properties import');
        } else {
          console.error('✗ Error importing properties:', error.message);
        }
      }
    }

    // ============================================================
    // STEP 4: Import OpenHouses
    // ============================================================
    if (!emergencyShutdown) {
      console.log('\n[STEP 4/4] IMPORTING OPEN HOUSES (Cook County, IL properties only)...');
      try {
        await mlsClient.processOpenHousesInBatches(
          async (batch) => {
            if (emergencyShutdown) {
              console.log('🛑 Emergency shutdown triggered. Stopping open houses import...');
              return;
            }

            for (const openHouse of batch) {
              try {
                const existing = await openHouseService.getOpenHouseByKey(openHouse.OpenHouseKey);
                const result = await openHouseService.upsertOpenHouse(openHouse);
                
                if (result.skipped) {
                  results.openHouses.skipped++;
                } else if (existing) {
                  results.openHouses.updated++;
                } else {
                  results.openHouses.created++;
                }

                const total = results.openHouses.created + results.openHouses.updated;
                if (total % 50 === 0 && total > 0) {
                  console.log(`  Progress: ${total} open houses processed (${results.openHouses.skipped} skipped)`);
                }
              } catch (error: any) {
                console.error(`  Error: ${openHouse.OpenHouseKey} - ${error.message}`);
                results.openHouses.errors++;
              }
            }
          },
          { batchSize: 500 }
        );
        
        if (!emergencyShutdown) {
          console.log(`✓ OpenHouses Complete: ${results.openHouses.created} created, ${results.openHouses.updated} updated, ${results.openHouses.errors} errors, ${results.openHouses.skipped} skipped`);
        }
      } catch (error: any) {
        if (error.message.includes('Rate limit exceeded after')) {
          emergencyShutdown = true;
          console.error('✗ CRITICAL: Rate limit exhausted during open houses import');
        } else {
          console.error('✗ Error importing open houses:', error.message);
        }
      }
    }

    // ============================================================
    // Log Results to Database
    // ============================================================
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const totalProcessed = 
      results.offices.created + results.offices.updated +
      results.members.created + results.members.updated +
      results.properties.created + results.properties.updated +
      results.openHouses.created + results.openHouses.updated;

    const totalCreated = 
      results.offices.created +
      results.members.created +
      results.properties.created +
      results.openHouses.created;

    const totalUpdated = 
      results.offices.updated +
      results.members.updated +
      results.properties.updated +
      results.openHouses.updated;

    const status = emergencyShutdown ? 'rate_limit_exceeded' : 'success';

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'All',
        'initial',
        status,
        totalProcessed,
        totalCreated,
        totalUpdated,
        0,
        new Date(startTime),
        new Date(),
        duration,
        emergencyShutdown ? 'Import paused due to rate limit exhaustion' : null,
      ]
    );

    if (emergencyShutdown) {
      console.log('\n========================================');
      console.log('🚨 IMPORT PAUSED DUE TO RATE LIMITS');
      console.log('========================================');
      console.log(`⏰ Please wait at least 65 minutes before resuming`);
      console.log(`📊 Progress saved:`);
      console.log(`   - Offices: ${results.offices.created + results.offices.updated}`);
      console.log(`   - Members: ${results.members.created + results.members.updated}`);
      console.log(`   - Properties: ${results.properties.created + results.properties.updated}`);
      console.log(`   - OpenHouses: ${results.openHouses.created + results.openHouses.updated}`);
      console.log('========================================');
    } else {
      console.log('\n========================================');
      console.log('✓ IMPORT COMPLETED SUCCESSFULLY');
      console.log('========================================');
      console.log(`Duration: ${duration}s (${Math.floor(duration / 60)}m ${duration % 60}s)`);
      console.log(`Total Records: ${totalProcessed}`);
      console.log(`  - Created: ${totalCreated}`);
      console.log(`  - Updated: ${totalUpdated}`);
      console.log('\nBreakdown by Resource (includes related media):');
      console.log(`  Offices:    ${results.offices.created}C / ${results.offices.updated}U / ${results.offices.errors}E`);
      console.log(`  Members:    ${results.members.created}C / ${results.members.updated}U / ${results.members.errors}E`);
      console.log(`  Properties: ${results.properties.created}C / ${results.properties.updated}U / ${results.properties.errors}E`);
      console.log(`  OpenHouses: ${results.openHouses.created}C / ${results.openHouses.updated}U / ${results.openHouses.errors}E / ${results.openHouses.skipped}S`);
      console.log('========================================');
    }

    // Log final rate limit stats
    mlsClient.logFinalStats();

    return NextResponse.json({
      success: !emergencyShutdown,
      message: emergencyShutdown 
        ? 'Import paused due to rate limits. Please wait 65 minutes and restart.'
        : 'Initial MLS data import completed (Cook County, IL)',
      emergencyShutdown,
      duration: `${duration}s`,
      durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
      summary: {
        totalProcessed,
        totalCreated,
        totalUpdated,
      },
      results,
      rateLimitStats: mlsClient.getRateLimitStats(),
    }, {
      status: emergencyShutdown ? 429 : 200
    });

  } catch (error: any) {
    console.error('\n========================================');
    console.error('✗ IMPORT FAILED');
    console.error('========================================');
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    await query(
      `INSERT INTO mls.sync_logs (
        resource_type, sync_type, status, records_processed,
        records_created, records_updated, records_deleted,
        started_at, completed_at, duration_seconds, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        'All',
        'initial',
        'error',
        0, 0, 0, 0,
        new Date(startTime),
        new Date(),
        duration,
        error.message,
      ]
    );

    mlsClient.logFinalStats();

    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        results,
        rateLimitStats: mlsClient.getRateLimitStats(),
      },
      { status: 500 }
    );
  }
}