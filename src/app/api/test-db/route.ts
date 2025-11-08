// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Database connected' : 'Database connection failed',
      environment: process.env.NODE_ENV,
      usingRDS: process.env.USE_RDS === 'true' || process.env.NODE_ENV === 'production',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}