// services/office.service.ts - Using raw SQL
import { query, transaction } from '@/lib/db';
import { MLSOffice } from '@/lib/types';

export class OfficeService {

  async upsertOffice(mlsOffice: MLSOffice) {
    try {
      return transaction(async (client) => {
        // Upsert main office
        await client.query(
          `INSERT INTO mls.offices (
            office_key, office_mls_id, office_name, office_email, office_phone,
            office_fax, office_address1, office_address2, office_city,
            office_state_or_province, office_postal_code, office_status,
            office_branch_type, mlg_can_view, originating_system_name,
            modification_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (office_key) DO UPDATE SET
            office_mls_id = EXCLUDED.office_mls_id,
            office_name = EXCLUDED.office_name,
            office_email = EXCLUDED.office_email,
            office_phone = EXCLUDED.office_phone,
            office_fax = EXCLUDED.office_fax,
            office_address1 = EXCLUDED.office_address1,
            office_address2 = EXCLUDED.office_address2,
            office_city = EXCLUDED.office_city,
            office_state_or_province = EXCLUDED.office_state_or_province,
            office_postal_code = EXCLUDED.office_postal_code,
            office_status = EXCLUDED.office_status,
            office_branch_type = EXCLUDED.office_branch_type,
            mlg_can_view = EXCLUDED.mlg_can_view,
            originating_system_name = EXCLUDED.originating_system_name,
            modification_timestamp = EXCLUDED.modification_timestamp,
            updated_at = CURRENT_TIMESTAMP`,
          [
            mlsOffice.OfficeKey,
            mlsOffice.OfficeMlsId,
            mlsOffice.OfficeName,
            mlsOffice.OfficeEmail,
            mlsOffice.OfficePhone,
            mlsOffice.OfficeFax,
            mlsOffice.OfficeAddress1,
            mlsOffice.OfficeAddress2,
            mlsOffice.OfficeCity,
            mlsOffice.OfficeStateOrProvince,
            mlsOffice.OfficePostalCode,
            mlsOffice.OfficeStatus,
            mlsOffice.OfficeBranchType,
            mlsOffice.MlgCanView,
            mlsOffice.OriginatingSystemName,
            mlsOffice.ModificationTimestamp,
          ]
        );

        // Handle Media
        if (mlsOffice.Media && mlsOffice.Media.length > 0) {
          // Delete existing media
          await client.query(
            'DELETE FROM mls.media WHERE resource_record_key = $1 AND resource_name = $2',
            [mlsOffice.OfficeKey, 'Office']
          );

          // Insert new media
          for (let i = 0; i < mlsOffice.Media.length; i++) {
            const media = mlsOffice.Media[i];
            await client.query(
              `INSERT INTO mls.media (
                media_key, resource_record_key, resource_name, media_url,
                media_type, media_category, "order", short_description,
                mlg_can_view, modification_timestamp
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (media_key) DO NOTHING`,
              [
                media.MediaKey,
                mlsOffice.OfficeKey,
                'Office',
                media.MediaURL,
                media.MediaType,
                media.MediaCategory,
                media.Order || i,
                media.ShortDescription,
                true,
                media.ModificationTimestamp || new Date().toISOString(),
              ]
            );
          }
        }
      });
    } catch (error) {
      console.error(`Error upserting office ${mlsOffice.OfficeKey}:`, error);
      throw error;
    }
  }

  async deleteOffice(officeKey: string) {
    await query('DELETE FROM mls.offices WHERE office_key = $1', [officeKey]);
  }

  async getOffices(page = 1, limit = 50, filters?: any) {
    const conditions: string[] = ['mlg_can_view = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.officeStatus) {
      conditions.push(`office_status = $${paramIndex++}`);
      params.push(filters.officeStatus);
    }
    if (filters?.officeType) {
      conditions.push(`office_branch_type = $${paramIndex++}`);
      params.push(filters.officeType);
    }
    if (filters?.officeCity) {
      conditions.push(`office_city ILIKE $${paramIndex++}`);
      params.push(`%${filters.officeCity}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM mls.offices ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get offices
    const officesResult = await query(
      `SELECT * FROM mls.offices 
       ${whereClause}
       ORDER BY office_name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: officesResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOfficeById(id: string) {
    const result = await query('SELECT * FROM mls.offices WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getOfficeByKey(officeKey: string) {
    const result = await query('SELECT * FROM mls.offices WHERE office_key = $1', [officeKey]);
    return result.rows[0] || null;
  }

  async getLastModificationTimestamp() {
    const result = await query<{ modification_timestamp: Date }>(
      'SELECT modification_timestamp FROM mls.offices ORDER BY modification_timestamp DESC LIMIT 1'
    );
    return result.rows[0]?.modification_timestamp || null;
  }
}

export const officeService = new OfficeService();