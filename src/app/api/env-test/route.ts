// src/app/api/env-test/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    USE_RDS: process.env.USE_RDS,
    HAS_DATABASE_URL_RDS: !!process.env.DATABASE_URL_RDS,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    DB_HOST: process.env.DATABASE_URL_RDS?.split('@')[1]?.split(':')[0] || 'NOT_SET',
  });
}