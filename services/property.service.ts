// services/property.service.ts - Using raw SQL
import { query, transaction } from '@/lib/db';
import { MLSProperty, PropertyFilters, PaginationResult } from '@/lib/types';

export class PropertyService {
  
  // Helper to convert array to comma-separated string or null
  private arrayToString(arr: any): string | null {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr.join(', ');
  }

  async upsertProperty(mlsProperty: MLSProperty) {
    return transaction(async (client) => {
      await client.query(
        `INSERT INTO mls.properties (
          listing_key,
          listing_id,
          standard_status,
          property_type,
          property_sub_type,
          list_price,
          original_list_price,
          close_price,
          unparsed_address,
          street_number,
          street_name,
          street_suffix,
          unit_number,
          city,
          state_or_province,
          postal_code,
          county_or_parish,
          bedrooms_total,
          bathrooms_total_integer,
          bathrooms_full,
          bathrooms_half,
          living_area,
          lot_size_area,
          lot_size_square_feet,
          year_built,
          mlg_can_view,
          originating_system_name,
          originating_system_key,
          list_agent_key,
          list_agent_mls_id,
          list_office_key,
          list_office_mls_id,
          modification_timestamp,
          originating_system_modification_timestamp,
          on_market_date,
          listing_contract_date,
          close_date,
          public_remarks,
          private_remarks,
          parking_features,
          parking_total
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
        )
        ON CONFLICT (listing_key) DO UPDATE SET
          listing_id = EXCLUDED.listing_id,
          standard_status = EXCLUDED.standard_status,
          property_type = EXCLUDED.property_type,
          property_sub_type = EXCLUDED.property_sub_type,
          list_price = EXCLUDED.list_price,
          original_list_price = EXCLUDED.original_list_price,
          close_price = EXCLUDED.close_price,
          unparsed_address = EXCLUDED.unparsed_address,
          street_number = EXCLUDED.street_number,
          street_name = EXCLUDED.street_name,
          street_suffix = EXCLUDED.street_suffix,
          unit_number = EXCLUDED.unit_number,
          city = EXCLUDED.city,
          state_or_province = EXCLUDED.state_or_province,
          postal_code = EXCLUDED.postal_code,
          county_or_parish = EXCLUDED.county_or_parish,
          bedrooms_total = EXCLUDED.bedrooms_total,
          bathrooms_total_integer = EXCLUDED.bathrooms_total_integer,
          bathrooms_full = EXCLUDED.bathrooms_full,
          bathrooms_half = EXCLUDED.bathrooms_half,
          living_area = EXCLUDED.living_area,
          lot_size_area = EXCLUDED.lot_size_area,
          lot_size_square_feet = EXCLUDED.lot_size_square_feet,
          year_built = EXCLUDED.year_built,
          mlg_can_view = EXCLUDED.mlg_can_view,
          originating_system_name = EXCLUDED.originating_system_name,
          originating_system_key = EXCLUDED.originating_system_key,
          list_agent_key = EXCLUDED.list_agent_key,
          list_agent_mls_id = EXCLUDED.list_agent_mls_id,
          list_office_key = EXCLUDED.list_office_key,
          list_office_mls_id = EXCLUDED.list_office_mls_id,
          modification_timestamp = EXCLUDED.modification_timestamp,
          originating_system_modification_timestamp = EXCLUDED.originating_system_modification_timestamp,
          on_market_date = EXCLUDED.on_market_date,
          listing_contract_date = EXCLUDED.listing_contract_date,
          close_date = EXCLUDED.close_date,
          public_remarks = EXCLUDED.public_remarks,
          private_remarks = EXCLUDED.private_remarks,
          parking_features = EXCLUDED.parking_features,
          parking_total = EXCLUDED.parking_total,
          updated_at = CURRENT_TIMESTAMP`,
        [
          mlsProperty.ListingKey,
          mlsProperty.ListingId,
          mlsProperty.StandardStatus,
          mlsProperty.PropertyType,
          mlsProperty.PropertySubType,
          mlsProperty.ListPrice,
          mlsProperty.OriginalListPrice,
          mlsProperty.ClosePrice,
          mlsProperty.UnparsedAddress,
          mlsProperty.StreetNumber,
          mlsProperty.StreetName,
          mlsProperty.StreetSuffix,
          mlsProperty.UnitNumber,
          mlsProperty.City,
          mlsProperty.StateOrProvince,
          mlsProperty.PostalCode,
          mlsProperty.CountyOrParish,
          mlsProperty.BedroomsTotal,
          mlsProperty.BathroomsTotalInteger ? Math.round(mlsProperty.BathroomsTotalInteger) : null,
          mlsProperty.BathroomsFull,
          mlsProperty.BathroomsHalf,
          mlsProperty.LivingArea,
          mlsProperty.LotSizeArea,
          mlsProperty.LotSizeSquareFeet,
          mlsProperty.YearBuilt,
          mlsProperty.MlgCanView,
          mlsProperty.OriginatingSystemName,
          mlsProperty.OriginatingSystemKey,
          mlsProperty.ListAgentKey,
          mlsProperty.ListAgentMlsId,
          mlsProperty.ListOfficeKey,
          mlsProperty.ListOfficeMlsId,
          mlsProperty.ModificationTimestamp,
          mlsProperty.OriginatingSystemModificationTimestamp || null,
          mlsProperty.OnMarketDate || null,
          mlsProperty.ListingContractDate || null,
          mlsProperty.CloseDate || null,
          mlsProperty.PublicRemarks,
          mlsProperty.PrivateRemarks,
          this.arrayToString(mlsProperty.ParkingFeatures),
          mlsProperty.ParkingTotal,
        ]
      );

      // Handle Media
      if (mlsProperty.Media && mlsProperty.Media.length > 0) {
        await client.query(
          'DELETE FROM mls.media WHERE resource_record_key = $1',
          [mlsProperty.ListingKey]
        );

        for (let i = 0; i < mlsProperty.Media.length; i++) {
          const media = mlsProperty.Media[i];
          await client.query(
            `INSERT INTO mls.media (
              media_key, resource_record_key, resource_name, media_url,
              media_type, media_category, "order", short_description,
              long_description, image_width, image_height, mlg_can_view,
              modification_timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (media_key) DO NOTHING`,
            [
              media.MediaKey,
              mlsProperty.ListingKey,
              'Property',
              media.MediaURL,
              media.MediaType,
              media.MediaCategory,
              media.Order || i,
              media.ShortDescription,
              media.LongDescription,
              media.ImageWidth,
              media.ImageHeight,
              true,
              media.ModificationTimestamp || new Date().toISOString(),
            ]
          );
        }
      }

      // Handle Rooms
      if (mlsProperty.Rooms && mlsProperty.Rooms.length > 0) {
        await client.query(
          'DELETE FROM mls.rooms WHERE listing_key = $1',
          [mlsProperty.ListingKey]
        );

        for (const room of mlsProperty.Rooms) {
          await client.query(
            `INSERT INTO mls.rooms (
              listing_key, room_type, room_level, room_length, room_width,
              room_area, room_dimensions, room_features, room_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              mlsProperty.ListingKey,
              room.RoomType,
              room.RoomLevel,
              room.RoomLength,
              room.RoomWidth,
              room.RoomArea,
              room.RoomDimensions,
              room.RoomFeatures,
              room.RoomDescription,
            ]
          );
        }
      }

      // Handle UnitTypes
      if (mlsProperty.UnitTypes && mlsProperty.UnitTypes.length > 0) {
        await client.query(
          'DELETE FROM mls.unit_types WHERE listing_key = $1',
          [mlsProperty.ListingKey]
        );

        for (const unit of mlsProperty.UnitTypes) {
          await client.query(
            `INSERT INTO mls.unit_types (
              listing_key, unit_type_type, unit_number, bedrooms_total,
              bathrooms_total_integer, unit_type_area, unit_type_rent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              mlsProperty.ListingKey,
              unit.UnitTypeType,
              unit.UnitNumber,
              unit.BedroomsTotal,
              unit.BathroomsTotalInteger,
              unit.UnitTypeArea,
              unit.UnitTypeRent,
            ]
          );
        }
      }
    });
  }

  async deleteProperty(listingKey: string) {
    await query('DELETE FROM mls.properties WHERE listing_key = $1', [listingKey]);
  }

  async getProperties(filters: PropertyFilters): Promise<PaginationResult<any>> {
    try {
      console.log('🔍 [Service] PropertyService.getProperties called');
      console.log('📋 [Service] Filters:', JSON.stringify(filters, null, 2));
      
      const {
        city,
        stateOrProvince,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        propertyType,
        standardStatus,
        minLivingArea,
        maxLivingArea,
        page = 1,
        limit = 20,
        sortBy = 'modification_timestamp',
        sortOrder = 'desc',
      } = filters;

      const conditions: string[] = ['mlg_can_view = true'];
      const params: any[] = [];
      let paramIndex = 1;

      if (city) {
        conditions.push(`city ILIKE $${paramIndex++}`);
        params.push(`%${city}%`);
      }
      if (stateOrProvince) {
        conditions.push(`state_or_province = $${paramIndex++}`);
        params.push(stateOrProvince);
      }
      if (propertyType) {
        conditions.push(`property_type = $${paramIndex++}`);
        params.push(propertyType);
      }
      if (standardStatus) {
        conditions.push(`standard_status = $${paramIndex++}`);
        params.push(standardStatus);
      }
      if (minPrice) {
        conditions.push(`list_price >= $${paramIndex++}`);
        params.push(minPrice);
      }
      if (maxPrice) {
        conditions.push(`list_price <= $${paramIndex++}`);
        params.push(maxPrice);
      }
      if (minBedrooms) {
        conditions.push(`bedrooms_total >= $${paramIndex++}`);
        params.push(minBedrooms);
      }
      if (maxBedrooms) {
        conditions.push(`bedrooms_total <= $${paramIndex++}`);
        params.push(maxBedrooms);
      }
      if (minBathrooms) {
        conditions.push(`bathrooms_total_integer >= $${paramIndex++}`);
        params.push(minBathrooms);
      }
      if (maxBathrooms) {
        conditions.push(`bathrooms_total_integer <= $${paramIndex++}`);
        params.push(maxBathrooms);
      }
      if (minLivingArea) {
        conditions.push(`living_area >= $${paramIndex++}`);
        params.push(minLivingArea);
      }
      if (maxLivingArea) {
        conditions.push(`living_area <= $${paramIndex++}`);
        params.push(maxLivingArea);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      console.log('📊 [Service] Executing COUNT query...');
      console.log('📝 [Service] WHERE clause:', whereClause);
      console.log('📝 [Service] Parameters:', params);

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM mls.properties ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      console.log(`✅ [Service] Total properties found: ${total}`);

      console.log('📊 [Service] Executing SELECT query...');
      const propertiesResult = await query(
        `SELECT * FROM mls.properties 
         ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );
      console.log(`✅ [Service] Retrieved ${propertiesResult.rows.length} properties`);

      const result: PaginationResult<any> = {
        data: propertiesResult.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      console.log('✅ [Service] Returning result:', {
        dataCount: result.data.length,
        pagination: result.pagination,
      });

      return result;
    } catch (error: any) {
      console.error('❌ [Service] Error in PropertyService.getProperties');
      console.error('❌ [Service] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port,
      });
      throw error;
    }
  }

  async getPropertyById(id: string) {
    const result = await query('SELECT * FROM mls.properties WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getPropertyByListingKey(listingKey: string) {
    const result = await query(
      'SELECT * FROM mls.properties WHERE listing_key = $1',
      [listingKey]
    );
    return result.rows[0] || null;
  }

  async getLastModificationTimestamp() {
    const result = await query<{ modification_timestamp: Date }>(
      'SELECT modification_timestamp FROM mls.properties ORDER BY modification_timestamp DESC LIMIT 1'
    );
    return result.rows[0]?.modification_timestamp || null;
  }
}

export const propertyService = new PropertyService();