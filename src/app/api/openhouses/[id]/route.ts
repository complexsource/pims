import { NextRequest, NextResponse } from 'next/server';
import { openHouseService } from '@services/openhouse.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Use getOpenHouseByKey instead of getOpenHouseById
    const openHouse = await openHouseService.getOpenHouseByKey(id);

    if (!openHouse) {
      return NextResponse.json(
        { success: false, error: 'Open house not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: openHouse,
    });
  } catch (error: any) {
    console.error('Error fetching open house:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}