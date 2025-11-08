import { NextRequest, NextResponse } from 'next/server';
import { openHouseService } from '../../../../services/openhouse.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const filters = {
      listingKey: searchParams.get('listingKey') || undefined,
      upcoming: searchParams.get('upcoming') === 'true',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const result = await openHouseService.getOpenHouses(page, limit, filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching open houses:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}