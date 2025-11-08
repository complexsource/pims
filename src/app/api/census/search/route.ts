// src/app/api/census/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/census/search
 * Global search across datasets, variables, and concepts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, datasets, variables
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters',
      }, { status: 400 });
    }

    const results: any = {
      success: true,
      query: q,
      results: {},
    };

    // Search datasets
    if (type === 'all' || type === 'datasets') {
      const datasetResults = await query(
        `SELECT 
          id,
          identifier,
          title,
          description,
          vintage,
          dataset_path,
          keywords,
          ts_rank(
            to_tsvector('english', title || ' ' || COALESCE(description, '')),
            plainto_tsquery('english', $1)
          ) as rank
        FROM census.datasets
        WHERE is_available = true
          AND (
            title ILIKE $2 OR
            description ILIKE $2 OR
            $3 = ANY(keywords) OR
            to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
          )
        ORDER BY rank DESC, vintage DESC NULLS LAST
        LIMIT $4`,
        [q, `%${q}%`, q, limit]
      );

      results.results.datasets = {
        count: datasetResults.rows.length,
        items: datasetResults.rows.map((row: any) => ({
          id: row.id,
          identifier: row.identifier,
          title: row.title,
          description: row.description?.substring(0, 200) + (row.description?.length > 200 ? '...' : ''),
          vintage: row.vintage,
          dataset_path: row.dataset_path,
          keywords: row.keywords,
        })),
      };
    }

    // Search variables across all datasets
    if (type === 'all' || type === 'variables') {
      const variableResults = await query(
        `SELECT 
          d.id as dataset_id,
          d.identifier,
          d.title as dataset_title,
          d.vintage,
          d.variables_data
        FROM census.datasets d
        WHERE is_available = true
          AND variables_data IS NOT NULL
          AND variables_synced = true
        LIMIT 100` // Limit datasets to search through
      );

      const matchedVariables: any[] = [];
      const searchLower = q.toLowerCase();

      for (const row of variableResults.rows) {
        const variables = row.variables_data?.variables || {};
        
        for (const [code, info] of Object.entries(variables) as [string, any][]) {
          const label = info.label || '';
          const concept = info.concept || '';
          
          if (
            code.toLowerCase().includes(searchLower) ||
            label.toLowerCase().includes(searchLower) ||
            concept.toLowerCase().includes(searchLower)
          ) {
            matchedVariables.push({
              variable_code: code,
              variable_label: label,
              variable_concept: concept,
              dataset_id: row.dataset_id,
              dataset_identifier: row.identifier,
              dataset_title: row.dataset_title,
              dataset_vintage: row.vintage,
            });

            // Limit results per dataset
            if (matchedVariables.length >= limit) break;
          }
        }

        if (matchedVariables.length >= limit) break;
      }

      results.results.variables = {
        count: matchedVariables.length,
        items: matchedVariables.slice(0, limit),
      };
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Error during search:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}