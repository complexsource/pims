// src/app/api/census/datasets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/datasets
 * Search and filter Census datasets with comprehensive options
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      // Search
      search: searchParams.get('search') || '',
      
      // Pagination
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      
      // Include metadata (default true)
      includeMetadata: searchParams.get('includeMetadata') !== 'false',
      
      // Filters
      vintage: searchParams.get('vintage') ? parseInt(searchParams.get('vintage')!) : null,
      vintageFrom: searchParams.get('vintageFrom') ? parseInt(searchParams.get('vintageFrom')!) : null,
      vintageTo: searchParams.get('vintageTo') ? parseInt(searchParams.get('vintageTo')!) : null,
      
      type: searchParams.get('type'), // microdata, cube, aggregate
      available: searchParams.get('available') !== 'false', // default true
      
      // Metadata filters
      hasGeography: searchParams.get('hasGeography') === 'true',
      hasVariables: searchParams.get('hasVariables') === 'true',
      hasTags: searchParams.get('hasTags') === 'true',
      
      // Sync status
      geographySynced: searchParams.get('geographySynced') === 'true',
      variablesSynced: searchParams.get('variablesSynced') === 'true',
      
      // Keywords/tags
      keyword: searchParams.get('keyword'),
      tag: searchParams.get('tag'),
      
      // Dataset path filter (e.g., "acs", "cbp")
      datasetPath: searchParams.get('datasetPath'),
      
      // Sort
      sortBy: searchParams.get('sortBy') || 'vintage',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Available filter
    if (filters.available) {
      conditions.push(`is_available = true`);
    }

    // Search in title and description
    if (filters.search) {
      conditions.push(`(
        title ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex} OR
        to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Vintage filters
    if (filters.vintage) {
      conditions.push(`vintage = $${paramIndex}`);
      values.push(filters.vintage);
      paramIndex++;
    }

    if (filters.vintageFrom) {
      conditions.push(`vintage >= $${paramIndex}`);
      values.push(filters.vintageFrom);
      paramIndex++;
    }

    if (filters.vintageTo) {
      conditions.push(`vintage <= $${paramIndex}`);
      values.push(filters.vintageTo);
      paramIndex++;
    }

    // Type filters
    if (filters.type === 'microdata') {
      conditions.push(`is_microdata = true`);
    } else if (filters.type === 'cube') {
      conditions.push(`is_cube = true`);
    } else if (filters.type === 'aggregate') {
      conditions.push(`is_aggregate = true`);
    }

    // Metadata availability filters
    if (filters.hasGeography) {
      conditions.push(`geography_data IS NOT NULL`);
    }

    if (filters.hasVariables) {
      conditions.push(`variables_data IS NOT NULL`);
    }

    if (filters.hasTags) {
      conditions.push(`tags_data IS NOT NULL`);
    }

    // Sync status filters
    if (filters.geographySynced) {
      conditions.push(`geography_synced = true`);
    }

    if (filters.variablesSynced) {
      conditions.push(`variables_synced = true`);
    }

    // Keyword filter
    if (filters.keyword) {
      conditions.push(`$${paramIndex} = ANY(keywords)`);
      values.push(filters.keyword);
      paramIndex++;
    }

    // Tag filter (searches in tags_data JSONB)
    if (filters.tag) {
      conditions.push(`tags_data->'tags' @> to_jsonb($${paramIndex}::text)`);
      values.push(filters.tag);
      paramIndex++;
    }

    // Dataset path filter
    if (filters.datasetPath) {
      conditions.push(`$${paramIndex} = ANY(dataset_path)`);
      values.push(filters.datasetPath);
      paramIndex++;
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Validate sort column
    const validSortColumns = ['vintage', 'title', 'created_at', 'updated_at', 'last_synced_at'];
    const sortColumn = validSortColumns.includes(filters.sortBy) ? filters.sortBy : 'vintage';
    const sortOrder = filters.sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Calculate offset
    const offset = (filters.page - 1) * filters.limit;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM census.datasets ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated results
    const metadataColumns = filters.includeMetadata ? `
        geography_data,
        variables_data,
        tags_data,
        examples_data,
        groups_data,
        sorts_data,` : '';

    const dataQuery = `
      SELECT 
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
        ${metadataColumns}
        keywords,
        access_level,
        modified_date,
        contact_name,
        contact_email,
        spatial,
        temporal,
        geography_synced,
        variables_synced,
        tags_synced,
        examples_synced,
        groups_synced,
        sorts_synced,
        last_synced_at,
        created_at,
        updated_at
      FROM census.datasets
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder} NULLS LAST, title ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await query(dataQuery, [...values, filters.limit, offset]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / filters.limit);
    const hasNextPage = filters.page < totalPages;
    const hasPrevPage = filters.page > 1;

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search: filters.search || null,
        vintage: filters.vintage,
        vintageFrom: filters.vintageFrom,
        vintageTo: filters.vintageTo,
        type: filters.type || null,
        available: filters.available,
        keyword: filters.keyword || null,
        tag: filters.tag || null,
        datasetPath: filters.datasetPath || null,
      },
    });

  } catch (error: any) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}