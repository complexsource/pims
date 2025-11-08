// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { propertyService } from '@services/property.service';
import type { PropertyFilters, APIResponse, PaginationResult } from '@/lib/types';

// Define the success response type
interface PropertySuccessResponse extends APIResponse<any> {
  success: true;
  properties: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Define the error response type
interface PropertyErrorResponse extends APIResponse<never> {
  success: false;
  error: string;
  errorCode?: string;
  errorType?: string;
  details?: any;
  environment?: {
    nodeEnv?: string;
    usingRDS?: boolean;
    hasDbUrl?: boolean;
  };
}

type PropertyApiResponse = PropertySuccessResponse | PropertyErrorResponse;

export async function GET(request: NextRequest): Promise<NextResponse<PropertyApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: PropertyFilters = {
      city: searchParams.get('city') || undefined,
      stateOrProvince: searchParams.get('stateOrProvince') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined,
      maxBedrooms: searchParams.get('maxBedrooms') ? Number(searchParams.get('maxBedrooms')) : undefined,
      minBathrooms: searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined,
      maxBathrooms: searchParams.get('maxBathrooms') ? Number(searchParams.get('maxBathrooms')) : undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      standardStatus: searchParams.get('standardStatus') || undefined,
      minLivingArea: searchParams.get('minLivingArea') ? Number(searchParams.get('minLivingArea')) : undefined,
      maxLivingArea: searchParams.get('maxLivingArea') ? Number(searchParams.get('maxLivingArea')) : undefined,
      minLotSize: searchParams.get('minLotSize') ? Number(searchParams.get('minLotSize')) : undefined,
      maxLotSize: searchParams.get('maxLotSize') ? Number(searchParams.get('maxLotSize')) : undefined,
      minYearBuilt: searchParams.get('minYearBuilt') ? Number(searchParams.get('minYearBuilt')) : undefined,
      maxYearBuilt: searchParams.get('maxYearBuilt') ? Number(searchParams.get('maxYearBuilt')) : undefined,
      hasPool: searchParams.get('hasPool') === 'true' ? true : undefined,
      hasGarage: searchParams.get('hasGarage') === 'true' ? true : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      sortBy: searchParams.get('sortBy') || 'modification_timestamp',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    console.log('📋 [API] Fetching properties with filters:', JSON.stringify(filters, null, 2));
    console.log('🌐 [API] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      useRDS: process.env.USE_RDS,
      hasDbUrlRds: !!process.env.DATABASE_URL_RDS,
    });
    
    const result: PaginationResult<any> = await propertyService.getProperties(filters);
    
    console.log('✅ [API] Properties fetched successfully:', {
      count: result.data?.length || 0,
      total: result.pagination?.total || 0,
      page: result.pagination?.page || 1,
      totalPages: result.pagination?.totalPages || 0,
    });

    return NextResponse.json({
      success: true,
      properties: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    // Enhanced error logging with more context
    console.error('❌ [API] Error in GET /api/properties');
    console.error('❌ [API] Error Details:', {
      name: error.name || 'Unknown',
      message: error.message || 'No error message',
      code: error.code || 'UNKNOWN_ERROR',
      stack: error.stack?.split('\n').slice(0, 5) || 'No stack trace',
      timestamp: new Date().toISOString(),
    });

    // Additional connection-specific logging
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 [API] ECONNREFUSED - Database connection refused');
      console.error('🔍 [API] Troubleshooting info:', {
        dbUrlExists: !!process.env.DATABASE_URL_RDS,
        nodeEnv: process.env.NODE_ENV,
        useRDS: process.env.USE_RDS,
      });
    }

    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch properties',
        errorCode: error.code || 'UNKNOWN_ERROR',
        errorType: error.name || 'Error',
        details: process.env.NODE_ENV === 'production' 
          ? 'Check server logs for more information'
          : {
              stack: error.stack?.split('\n').slice(0, 5) || [],
              originalError: error.toString(),
              cause: error.cause,
              errno: error.errno,
              syscall: error.syscall,
              address: error.address,
              port: error.port,
            },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          usingRDS: process.env.USE_RDS === 'true' || process.env.NODE_ENV === 'production',
          hasDbUrl: !!process.env.DATABASE_URL_RDS,
        },
      },
      { status: 500 }
    );
  }
}