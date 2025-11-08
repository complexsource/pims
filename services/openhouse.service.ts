// services/openhouse.service.ts
import { query, transaction } from '@/lib/db';
import { MLSOpenHouse } from '@/lib/types';

export class OpenHouseService {
  
  async upsertOpenHouse(openHouse: MLSOpenHouse) {
    try {
      return transaction(async (client) => {
        // CRITICAL: Check if the property exists first
        const propertyCheck = await client.query(
          'SELECT listing_key FROM mls.properties WHERE listing_key = $1',
          [openHouse.ListingKey]
        );

        // Skip if property doesn't exist (it's outside Cook County, IL filter)
        if (propertyCheck.rows.length === 0) {
          return { 
            success: false, 
            skipped: true, 
            reason: 'property_not_found',
            listingKey: openHouse.ListingKey 
          };
        }

        // Upsert open house only if property exists
        await client.query(
          `INSERT INTO mls.open_houses (
            open_house_key, listing_key, listing_id, open_house_id,
            open_house_date, open_house_start_time, open_house_end_time,
            open_house_type, open_house_status, open_house_remarks,
            refreshments, mlg_can_view, originating_system_name,
            modification_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (open_house_key) DO UPDATE SET
            listing_key = EXCLUDED.listing_key,
            listing_id = EXCLUDED.listing_id,
            open_house_id = EXCLUDED.open_house_id,
            open_house_date = EXCLUDED.open_house_date,
            open_house_start_time = EXCLUDED.open_house_start_time,
            open_house_end_time = EXCLUDED.open_house_end_time,
            open_house_type = EXCLUDED.open_house_type,
            open_house_status = EXCLUDED.open_house_status,
            open_house_remarks = EXCLUDED.open_house_remarks,
            refreshments = EXCLUDED.refreshments,
            mlg_can_view = EXCLUDED.mlg_can_view,
            originating_system_name = EXCLUDED.originating_system_name,
            modification_timestamp = EXCLUDED.modification_timestamp,
            updated_at = CURRENT_TIMESTAMP`,
          [
            openHouse.OpenHouseKey,
            openHouse.ListingKey,
            openHouse.ListingId,
            openHouse.OpenHouseId,
            openHouse.OpenHouseDate,
            openHouse.OpenHouseStartTime,
            openHouse.OpenHouseEndTime,
            openHouse.OpenHouseType,
            openHouse.OpenHouseStatus,
            openHouse.OpenHouseRemarks,
            openHouse.Refreshments,
            openHouse.MlgCanView,
            openHouse.OriginatingSystemName,
            openHouse.ModificationTimestamp,
          ]
        );

        return { success: true, skipped: false };
      });
    } catch (error) {
      console.error(`Error upserting open house ${openHouse.OpenHouseKey}:`, error);
      throw error;
    }
  }

  async deleteOpenHouse(openHouseKey: string) {
    await query('DELETE FROM mls.open_houses WHERE open_house_key = $1', [openHouseKey]);
  }

  async getOpenHouses(page = 1, limit = 50, filters?: any) {
    const conditions: string[] = ['mlg_can_view = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.listingKey) {
      conditions.push(`listing_key = $${paramIndex++}`);
      params.push(filters.listingKey);
    }
    if (filters?.openHouseStatus) {
      conditions.push(`open_house_status = $${paramIndex++}`);
      params.push(filters.openHouseStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM mls.open_houses ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const openHousesResult = await query(
      `SELECT * FROM mls.open_houses 
       ${whereClause}
       ORDER BY open_house_date DESC, open_house_start_time ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: openHousesResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOpenHouseByKey(openHouseKey: string) {
    const result = await query('SELECT * FROM mls.open_houses WHERE open_house_key = $1', [openHouseKey]);
    return result.rows[0] || null;
  }

  async getLastModificationTimestamp() {
    const result = await query<{ modification_timestamp: Date }>(
      'SELECT modification_timestamp FROM mls.open_houses ORDER BY modification_timestamp DESC LIMIT 1'
    );
    return result.rows[0]?.modification_timestamp || null;
  }
}

export const openHouseService = new OpenHouseService();