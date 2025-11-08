// src/app/api/census/datasets/[id]/geography/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/datasets/:id/geography
 * Get available geography levels for a dataset
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Get dataset
    let datasetResult;
    if (isUuid) {
      // Search by UUID
      datasetResult = await query(
        `SELECT id, identifier, title, geography_data, geography_synced 
         FROM census.datasets 
         WHERE id = $1`,
        [id]
      );
    } else {
      // Search by identifier (full match or partial)
      datasetResult = await query(
        `SELECT id, identifier, title, geography_data, geography_synced 
         FROM census.datasets 
         WHERE identifier LIKE $1 OR identifier LIKE $2
         LIMIT 1`,
        [`%${id}%`, `%${id}`]
      );
    }

    if (datasetResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const dataset = datasetResult.rows[0];

    if (!dataset.geography_data || !dataset.geography_data.fips) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Geography data not available for this dataset',
          hint: dataset.geography_synced 
            ? 'Dataset has no geography metadata'
            : 'Run metadata sync for this dataset first'
        },
        { status: 404 }
      );
    }

    // Parse geography levels
    const geographyLevels = dataset.geography_data.fips.map((level: any) => ({
      name: level.name,
      geoLevelId: level.geoLevelId,
      geoLevelDisplay: level.geoLevelDisplay,
      limit: level.limit,
      requires: level.requires || [],
      wildcard: level.wildcard || [],
      optionalWithWCFor: level.optionalWithWCFor || null,
      description: getGeographyDescription(level.name),
    }));

    return NextResponse.json({
      success: true,
      data: {
        dataset: {
          id: dataset.id,
          identifier: dataset.identifier,
          title: dataset.title,
        },
        geography_levels: geographyLevels,
        total_levels: geographyLevels.length,
      },
    });

  } catch (error: any) {
    console.error('Error fetching geography:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to provide human-readable descriptions for geography levels
 */
function getGeographyDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'us': 'United States',
    'state': 'State level',
    'county': 'County level',
    'tract': 'Census tract',
    'block group': 'Block group',
    'block': 'Census block',
    'place': 'Incorporated place',
    'zip code tabulation area': 'ZIP code area',
    'zcta': 'ZIP Code Tabulation Area',
    'metropolitan statistical area/micropolitan statistical area': 'Metro/Micro area',
    'combined statistical area': 'Combined statistical area',
    'congressional district': 'Congressional district',
    'school district': 'School district',
    'urban area': 'Urban area',
  };

  return descriptions[name.toLowerCase()] || name;
}