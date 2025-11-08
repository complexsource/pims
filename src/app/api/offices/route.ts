import { NextRequest, NextResponse } from 'next/server';
import { officeService } from '../../../../services/office.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const filters = {
      officeStatus: searchParams.get('officeStatus') || undefined,
      officeType: searchParams.get('officeType') || undefined,
      officeCity: searchParams.get('officeCity') || undefined,
    };

    const result = await officeService.getOffices(page, limit, filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching offices:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}