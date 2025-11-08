// src/app/api/diagnostics/route.ts
import { NextResponse } from 'next/server';
import { testConnection, pool } from '@/lib/db';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      USE_RDS: process.env.USE_RDS,
      HAS_DATABASE_URL_RDS: !!process.env.DATABASE_URL_RDS,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    },
    connection: {
      status: 'unknown',
      details: null,
      error: null,
    },
    poolStatus: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    },
  };

  // Parse database URL (without exposing password)
  const dbUrl = process.env.DATABASE_URL_RDS || process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      diagnostics.databaseConfig = {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1).split('?')[0],
        username: url.username,
        hasPassword: !!url.password,
        searchParams: Object.fromEntries(url.searchParams),
      };
    } catch (e: any) {
      diagnostics.databaseConfig = {
        error: 'Failed to parse DATABASE_URL',
        message: e.message,
      };
    }
  }

  // Test connection
  try {
    console.log('🔍 [Diagnostics] Running connection test...');
    const isConnected = await testConnection();
    
    diagnostics.connection.status = isConnected ? 'connected' : 'failed';
    
    if (isConnected) {
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      diagnostics.connection.details = result.rows[0];
    }
  } catch (error: any) {
    diagnostics.connection.status = 'error';
    diagnostics.connection.error = {
      code: error.code,
      message: error.message,
      name: error.name,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
    };

    if (error.code === 'ECONNREFUSED') {
      diagnostics.connection.troubleshooting = [
        '1. Check AWS RDS Security Group - ensure port 5432 is open to 0.0.0.0/0',
        '2. Verify RDS instance is "Publicly accessible" = Yes',
        '3. Confirm RDS endpoint URL is correct in DATABASE_URL_RDS',
        '4. Check if RDS instance status is "Available" (not stopped)',
        '5. Verify VPC and subnet configuration allows external access',
        '6. Test connectivity: telnet pmssystem.clsse26gas59.eu-north-1.rds.amazonaws.com 5432',
      ];
    } else if (error.code === 'ETIMEDOUT') {
      diagnostics.connection.troubleshooting = [
        '1. RDS Security Group is blocking connections',
        '2. Check VPC route tables and network ACLs',
        '3. Verify Render can reach AWS (network connectivity issue)',
        '4. Check if a firewall is blocking port 5432',
      ];
    }
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.connection.status === 'connected' ? 200 : 500,
  });
}