// services/member.service.ts
import { query, transaction } from '@/lib/db';
import { MLSMember } from '@/lib/types';

export class MemberService {

  async upsertMember(mlsMember: MLSMember) {
    try {
      return transaction(async (client) => {
        // Upsert main member
        await client.query(
          `INSERT INTO mls.members (
            member_key, member_mls_id, member_first_name, member_last_name,
            member_full_name, member_email, member_mobile_phone, member_office_phone,
            member_home_phone, office_key, office_mls_id, office_name,
            member_status, member_type, mlg_can_view, originating_system_name,
            modification_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (member_key) DO UPDATE SET
            member_mls_id = EXCLUDED.member_mls_id,
            member_first_name = EXCLUDED.member_first_name,
            member_last_name = EXCLUDED.member_last_name,
            member_full_name = EXCLUDED.member_full_name,
            member_email = EXCLUDED.member_email,
            member_mobile_phone = EXCLUDED.member_mobile_phone,
            member_office_phone = EXCLUDED.member_office_phone,
            member_home_phone = EXCLUDED.member_home_phone,
            office_key = EXCLUDED.office_key,
            office_mls_id = EXCLUDED.office_mls_id,
            office_name = EXCLUDED.office_name,
            member_status = EXCLUDED.member_status,
            member_type = EXCLUDED.member_type,
            mlg_can_view = EXCLUDED.mlg_can_view,
            originating_system_name = EXCLUDED.originating_system_name,
            modification_timestamp = EXCLUDED.modification_timestamp,
            updated_at = CURRENT_TIMESTAMP`,
          [
            mlsMember.MemberKey,
            mlsMember.MemberMlsId,
            mlsMember.MemberFirstName,
            mlsMember.MemberLastName,
            mlsMember.MemberFullName,
            mlsMember.MemberEmail,
            mlsMember.MemberMobilePhone,
            mlsMember.MemberOfficePhone,
            mlsMember.MemberHomePhone,
            mlsMember.OfficeKey,
            mlsMember.OfficeMlsId,
            mlsMember.OfficeName,
            mlsMember.MemberStatus,
            mlsMember.MemberType,
            mlsMember.MlgCanView,
            mlsMember.OriginatingSystemName,
            mlsMember.ModificationTimestamp,
          ]
        );

        // Handle Media
        if (mlsMember.Media && mlsMember.Media.length > 0) {
          // Delete existing media
          await client.query(
            'DELETE FROM mls.media WHERE resource_record_key = $1 AND resource_name = $2',
            [mlsMember.MemberKey, 'Member']
          );

          // Insert new media
          for (let i = 0; i < mlsMember.Media.length; i++) {
            const media = mlsMember.Media[i];
            await client.query(
              `INSERT INTO mls.media (
                media_key, resource_record_key, resource_name, media_url,
                media_type, media_category, "order", short_description,
                mlg_can_view, modification_timestamp
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (media_key) DO UPDATE SET
                resource_record_key = EXCLUDED.resource_record_key,
                resource_name = EXCLUDED.resource_name,
                media_url = EXCLUDED.media_url,
                media_type = EXCLUDED.media_type,
                media_category = EXCLUDED.media_category,
                "order" = EXCLUDED."order",
                short_description = EXCLUDED.short_description,
                mlg_can_view = EXCLUDED.mlg_can_view,
                modification_timestamp = EXCLUDED.modification_timestamp`,
              [
                media.MediaKey,
                mlsMember.MemberKey,
                'Member',
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
      console.error(`Error upserting member ${mlsMember.MemberKey}:`, error);
      throw error;
    }
  }

  async deleteMember(memberKey: string) {
    await query('DELETE FROM mls.members WHERE member_key = $1', [memberKey]);
  }

  async getMembers(page = 1, limit = 50, filters?: any) {
    const conditions: string[] = ['mlg_can_view = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.memberStatus) {
      conditions.push(`member_status = $${paramIndex++}`);
      params.push(filters.memberStatus);
    }
    if (filters?.memberType) {
      conditions.push(`member_type = $${paramIndex++}`);
      params.push(filters.memberType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM mls.members ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const membersResult = await query(
      `SELECT * FROM mls.members 
       ${whereClause}
       ORDER BY member_last_name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: membersResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMemberById(id: string) {
    const result = await query('SELECT * FROM mls.members WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getMemberByKey(memberKey: string) {
    const result = await query('SELECT * FROM mls.members WHERE member_key = $1', [memberKey]);
    return result.rows[0] || null;
  }

  async getLastModificationTimestamp() {
    const result = await query<{ modification_timestamp: Date }>(
      'SELECT modification_timestamp FROM mls.members ORDER BY modification_timestamp DESC LIMIT 1'
    );
    return result.rows[0]?.modification_timestamp || null;
  }
}

export const memberService = new MemberService();