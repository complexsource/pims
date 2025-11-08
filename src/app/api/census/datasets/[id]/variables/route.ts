// src/app/api/census/datasets/[id]/variables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/datasets/:id/variables
 * Get variables for a dataset with search and filter capabilities
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      search: searchParams.get('search') || '',
      concept: searchParams.get('concept'), // Filter by concept
      predicateType: searchParams.get('predicateType'), // int, string, etc.
      group: searchParams.get('group'), // Filter by group
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 500),
    };

    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Get dataset
    let datasetResult;
    if (isUuid) {
      datasetResult = await query(
        `SELECT id, identifier, title, variables_data, variables_synced 
         FROM census.datasets 
         WHERE id = $1`,
        [id]
      );
    } else {
      datasetResult = await query(
        `SELECT id, identifier, title, variables_data, variables_synced 
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

    if (!dataset.variables_data || !dataset.variables_data.variables) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Variables data not available for this dataset',
          hint: dataset.variables_synced 
            ? 'Dataset has no variables metadata'
            : 'Run metadata sync for this dataset first'
        },
        { status: 404 }
      );
    }

    // Get all variables
    const allVariables = dataset.variables_data.variables;
    let variables = Object.entries(allVariables).map(([code, info]: [string, any]) => ({
      code,
      label: info.label || '',
      concept: info.concept || '',
      predicateType: info.predicateType || '',
      group: info.group || '',
      limit: info.limit || 0,
      attributes: info.attributes || null,
      required: info.required || false,
      predicateOnly: info.predicateOnly || false,
    }));

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      variables = variables.filter(v => 
        v.code.toLowerCase().includes(searchLower) ||
        v.label.toLowerCase().includes(searchLower) ||
        v.concept.toLowerCase().includes(searchLower)
      );
    }

    if (filters.concept) {
      variables = variables.filter(v => 
        v.concept.toLowerCase().includes(filters.concept!.toLowerCase())
      );
    }

    if (filters.predicateType) {
      variables = variables.filter(v => v.predicateType === filters.predicateType);
    }

    if (filters.group) {
      variables = variables.filter(v => v.group === filters.group);
    }

    // Get unique concepts and predicate types for filtering UI
    const concepts = [...new Set(variables.map(v => v.concept).filter(c => c))];
    const predicateTypes = [...new Set(variables.map(v => v.predicateType).filter(p => p))];
    const groups = [...new Set(variables.map(v => v.group).filter(g => g))];

    // Sort by code
    variables.sort((a, b) => a.code.localeCompare(b.code));

    // Pagination
    const totalCount = variables.length;
    const totalPages = Math.ceil(totalCount / filters.limit);
    const offset = (filters.page - 1) * filters.limit;
    const paginatedVariables = variables.slice(offset, offset + filters.limit);

    return NextResponse.json({
      success: true,
      data: {
        dataset: {
          id: dataset.id,
          identifier: dataset.identifier,
          title: dataset.title,
        },
        variables: paginatedVariables,
      },
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages,
        hasNextPage: filters.page < totalPages,
        hasPrevPage: filters.page > 1,
      },
      filters: {
        search: filters.search || null,
        concept: filters.concept || null,
        predicateType: filters.predicateType || null,
        group: filters.group || null,
      },
      available_filters: {
        concepts: concepts.sort(),
        predicateTypes: predicateTypes.sort(),
        groups: groups.sort(),
      },
    });

  } catch (error: any) {
    console.error('Error fetching variables:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}