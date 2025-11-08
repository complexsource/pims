// src/services/media.service.ts
import { query } from '@/lib/db';

export interface Media {
  MediaKey: string;
  ResourceRecordKey?: string;
  ResourceName?: string;
  MediaURL: string;
  MediaType?: string;
  MediaCategory?: string;
  Order?: number;
  ShortDescription?: string;
  LongDescription?: string;
  ImageWidth?: number;
  ImageHeight?: number;
  MlgCanView?: boolean;
  ModificationTimestamp: Date;
}

class MediaService {
  /**
   * Get media by key
   */
  async getMediaByKey(mediaKey: string): Promise<any> {
    const result = await query(
      'SELECT * FROM mls.media WHERE media_key = $1',
      [mediaKey]
    );
    return result.rows[0];
  }

  /**
   * Upsert media
   */
  async upsertMedia(media: Media): Promise<void> {
    await query(
      `INSERT INTO mls.media (
        media_key, resource_record_key, resource_name,
        media_url, media_type, media_category, "order",
        short_description, long_description,
        image_width, image_height, image_size,
        mlg_can_view, originating_system_name,
        modification_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (media_key) 
      DO UPDATE SET
        resource_record_key = EXCLUDED.resource_record_key,
        resource_name = EXCLUDED.resource_name,
        media_url = EXCLUDED.media_url,
        media_type = EXCLUDED.media_type,
        media_category = EXCLUDED.media_category,
        "order" = EXCLUDED."order",
        short_description = EXCLUDED.short_description,
        long_description = EXCLUDED.long_description,
        image_width = EXCLUDED.image_width,
        image_height = EXCLUDED.image_height,
        image_size = EXCLUDED.image_size,
        mlg_can_view = EXCLUDED.mlg_can_view,
        originating_system_name = EXCLUDED.originating_system_name,
        modification_timestamp = EXCLUDED.modification_timestamp,
        updated_at = CURRENT_TIMESTAMP`,
      [
        media.MediaKey,
        media.ResourceRecordKey || null,
        media.ResourceName || null,
        media.MediaURL,
        media.MediaType || null,
        media.MediaCategory || null,
        media.Order || 0,
        media.ShortDescription || null,
        media.LongDescription || null,
        media.ImageWidth || null,
        media.ImageHeight || null,
        null, // image_size - not in API response
        media.MlgCanView !== undefined ? media.MlgCanView : true,
        null, // originating_system_name - add if available
        media.ModificationTimestamp,
      ]
    );
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaKey: string): Promise<void> {
    await query('DELETE FROM mls.media WHERE media_key = $1', [mediaKey]);
  }

  /**
   * Get last modification timestamp
   */
  async getLastModificationTimestamp(): Promise<Date | null> {
    const result = await query(
      'SELECT MAX(modification_timestamp) as last_modified FROM mls.media'
    );
    return result.rows[0]?.last_modified || null;
  }

  /**
   * Get media for a specific resource
   */
  async getMediaForResource(
    resourceRecordKey: string,
    resourceName: string
  ): Promise<any[]> {
    const result = await query(
      `SELECT * FROM mls.media 
       WHERE resource_record_key = $1 
       AND resource_name = $2 
       ORDER BY "order" ASC`,
      [resourceRecordKey, resourceName]
    );
    return result.rows;
  }

  /**
   * Get property images
   */
  async getPropertyImages(listingKey: string): Promise<any[]> {
    return this.getMediaForResource(listingKey, 'Property');
  }

  /**
   * Get member photos
   */
  async getMemberPhotos(memberKey: string): Promise<any[]> {
    return this.getMediaForResource(memberKey, 'Member');
  }

  /**
   * Get office photos
   */
  async getOfficePhotos(officeKey: string): Promise<any[]> {
    return this.getMediaForResource(officeKey, 'Office');
  }
}

export const mediaService = new MediaService();