// src/app/api/census/datasets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/datasets/:id
 * Get a single dataset with full details including metadata
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Query parameters for controlling what to include
    const { searchParams } = new URL(request.url);
    const includeMetadata = searchParams.get('includeMetadata') !== 'false'; // default true
    const includeRaw = searchParams.get('includeRaw') === 'true'; // default false

    // Build SELECT clause based on what to include
    const selectColumns = `
      id,
      identifier,
      title,
      description,
      vintage,
      dataset_path,
      is_microdata,
      is_cube,
      is_aggregate,
      is_available,
      api_endpoint,
      geography_link,
      variables_link,
      tags_link,
      examples_link,
      groups_link,
      sorts_link,
      documentation_link,
      keywords,
      access_level,
      modified_date,
      contact_name,
      contact_email,
      distribution_format,
      distribution_media_type,
      spatial,
      temporal,
      license,
      bureau_code,
      program_code,
      reference_urls,
      ${includeMetadata ? `
        geography_data,
        variables_data,
        tags_data,
        examples_data,
        groups_data,
        sorts_data,
      ` : ''}
      ${includeRaw ? 'raw_metadata,' : ''}
      publisher_data,
      contact_point_data,
      geography_synced,
      variables_synced,
      tags_synced,
      examples_synced,
      groups_synced,
      sorts_synced,
      last_synced_at,
      created_at,
      updated_at
    `;

    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let result;
    if (isUuid) {
      // Search by UUID
      result = await query(
        `SELECT ${selectColumns} FROM census.datasets WHERE id = $1`,
        [id]
      );
    } else {
      // Search by identifier (full match or partial)
      result = await query(
        `SELECT ${selectColumns} FROM census.datasets WHERE identifier LIKE $1 OR identifier LIKE $2 LIMIT 1`,
        [`%${id}%`, `%${id}`]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dataset not found' 
        },
        { status: 404 }
      );
    }

    const dataset = result.rows[0];

    // Parse metadata if included
    const response: any = {
      success: true,
      data: {
        ...dataset,
      }
    };

    // Add helper info
    if (includeMetadata) {
      response.data.metadata_available = {
        geography: dataset.geography_data !== null,
        variables: dataset.variables_data !== null,
        tags: dataset.tags_data !== null,
        examples: dataset.examples_data !== null,
        groups: dataset.groups_data !== null,
        sorts: dataset.sorts_data !== null,
      };

      // Count variables if available
      if (dataset.variables_data?.variables) {
        response.data.variable_count = Object.keys(dataset.variables_data.variables).length;
      }

      // Count geography levels if available
      if (dataset.geography_data?.fips) {
        response.data.geography_level_count = dataset.geography_data.fips.length;
      }

      // List tags if available
      if (dataset.tags_data?.tags) {
        response.data.tags_list = dataset.tags_data.tags;
      }
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}