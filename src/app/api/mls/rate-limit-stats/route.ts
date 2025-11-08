// src/app/api/mls/rate-limit-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mlsClient } from '@/lib/mls-client';
import { rateLimiter } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const stats = mlsClient.getRateLimitStats();
    const warningStatus = rateLimiter.getWarningStatus();
    
    // Determine overall health status
    let healthStatus = 'healthy';
    if (stats.percentages.bandwidthHourly > 90 || stats.percentages.requestsHourly > 90) {
      healthStatus = 'critical';
    } else if (stats.percentages.bandwidthHourly > 80 || stats.percentages.requestsHourly > 80) {
      healthStatus = 'warning';
    }
    
    return NextResponse.json({
      success: true,
      healthStatus,
      stats,
      warningStatus,
      mlsGridLimits: {
        warning: {
          requestsPerHour: 7200,
          mbPerHour: 3072,
          requestsPerSecond: 4,
          requestsPer24Hours: 40000,
          gbPer24Hours: 40,
        },
        suspension: {
          requestsPerHour: 18000,
          mbPerHour: 4096,
          requestsPerSecond: 6,
          requestsPer24Hours: 60000,
          gbPer24Hours: 60,
        }
      },
      ourLimits: {
        requestsPerHour: stats.limits.maxRequestsPerHour,
        mbPerHour: stats.limits.maxMBPerHour,
        requestsPerSecond: stats.limits.maxRequestsPerSecond,
        requestsPer24Hours: stats.limits.maxRequestsPer24Hours,
        gbPer24Hours: stats.limits.maxGBPer24Hours,
      },
      recommendations: warningStatus.hasWarning 
        ? [
            'PAUSE OPERATIONS IMMEDIATELY',
            'Wait for rate limit windows to reset (65 minutes)',
            'Consider reducing batch size',
            'Monitor bandwidth usage closely'
          ]
        : [
            'All limits within safe thresholds',
            'Continue normal operations',
            'Current pace is sustainable'
          ]
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}