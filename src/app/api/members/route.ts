import { NextRequest, NextResponse } from 'next/server';
import { memberService } from '../../../../services/member.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const filters = {
      memberStatus: searchParams.get('memberStatus') || undefined,
      memberType: searchParams.get('memberType') || undefined,
    };

    const result = await memberService.getMembers(page, limit, filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}