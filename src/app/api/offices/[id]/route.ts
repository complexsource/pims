import { NextRequest, NextResponse } from 'next/server';
import { officeService } from '../../../../../services/office.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const office = await officeService.getOfficeById(id);

    if (!office) {
      return NextResponse.json(
        { success: false, error: 'Office not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: office,
    });
  } catch (error: any) {
    console.error('Error fetching office:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}