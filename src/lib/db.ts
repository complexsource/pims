// lib/db.ts - PostgreSQL connection without Prisma
import { Pool, QueryResult, QueryResultRow } from 'pg';

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

// Determine which database URL to use based on environment
const getDatabaseUrl = () => {
  const nodeEnv = process.env.NODE_ENV as string;
  const useRDS = process.env.USE_RDS === 'true';

  // Use RDS if explicitly requested OR in production
  if (useRDS || nodeEnv === 'production') {
    return process.env.DATABASE_URL_RDS;
  }

  // Default to local database
  return process.env.DATABASE_URL;
};

// Check if using RDS
const isRDS = () => {
  const nodeEnv = process.env.NODE_ENV as string;
  return process.env.USE_RDS === 'true' || nodeEnv === 'production';
};

// Get the active database URL
const activeDbUrl = getDatabaseUrl();

// Log which database we're connecting to (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔌 Connecting to: ${isRDS() ? 'AWS RDS' : 'Local PostgreSQL'}`); // ✅ Fixed
  console.log(`📍 Database URL: ${activeDbUrl?.replace(/:[^:@]+@/, ':****@')}`); // ✅ Fixed
}

// Create PostgreSQL connection pool with optimized settings for RDS
export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: activeDbUrl,
    max: isRDS() ? 30 : 20, // More connections for RDS
    min: isRDS() ? 2 : 0, // Keep minimum connections alive for RDS
    idleTimeoutMillis: isRDS() ? 60000 : 30000, // Longer for RDS
    connectionTimeoutMillis: isRDS() ? 30000 : 10000, // ✅ Much longer timeout for RDS
    query_timeout: isRDS() ? 30000 : 10000, // Query timeout
    ssl: isRDS() 
      ? { 
          rejectUnauthorized: false, // ✅ Required for AWS RDS
          // Alternatively, use this for better security:
          // rejectUnauthorized: true,
          // ca: fs.readFileSync('./rds-ca-bundle.pem').toString()
        }
      : false,
    // ✅ Added: Better connection error handling
    application_name: 'pmssystem-app',
  });

// ✅ Added: Connection error handler
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// ✅ Added: Connection event handler (for debugging)
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', (client) => {
    console.log('✅ New database connection established');
  });
  
  pool.on('remove', (client) => {
    console.log('🔌 Database connection removed from pool');
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

// Helper function for queries with retry logic and detailed logging
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const maxRetries = 3;
  let lastError: any;

  // Log connection attempt details
  console.log('🔍 Query attempt details:', {
    isRDS: isRDS(),
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!activeDbUrl,
    dbHost: activeDbUrl?.split('@')[1]?.split('/')[0], // Extract host without password
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // ✅ Detailed error logging
      console.error(`❌ Database query error (attempt ${attempt}/${maxRetries}):`, {
        errorCode: error.code,
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines
        host: error.hostname || 'unknown',
        port: error.port || 'unknown',
      });
      
      // Don't retry on specific errors
      if (error.code === '23505' || // Unique violation
          error.code === '23503' || // Foreign key violation
          error.code === '42P01') {  // Undefined table
        throw error;
      }
      
      // Retry on connection errors
      if (attempt < maxRetries && (
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.message?.includes('Connection terminated'))) {
        const delay = attempt * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

// Helper for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ✅ Enhanced test connection function with detailed diagnostics
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📡 Connecting to: ${isRDS() ? 'AWS RDS' : 'Local PostgreSQL'}`);
    
    const result = await query('SELECT NOW(), current_database(), version(), inet_server_addr() as server_ip');
    const dbInfo = result.rows[0];
    
    console.log('✅ Database connection successful!');
    console.log('📅 Server time:', dbInfo.now);
    console.log('🗄️  Database:', dbInfo.current_database);
    console.log('🔧 Version:', dbInfo.version.split(' ')[0], dbInfo.version.split(' ')[1]);
    console.log('🌐 Server IP:', dbInfo.server_ip || 'N/A');
    
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // ✅ Provide specific troubleshooting tips
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting ECONNREFUSED:');
      console.error('1. Check if RDS security group allows inbound traffic on port 5432');
      console.error('2. Verify RDS instance is publicly accessible');
      console.error('3. Confirm the RDS endpoint URL is correct');
      console.error('4. Check if RDS instance is running (not stopped)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔧 Troubleshooting ETIMEDOUT:');
      console.error('1. RDS security group may be blocking the connection');
      console.error('2. Check VPC and subnet configuration');
      console.error('3. Verify network connectivity from Render to AWS');
    } else if (error.code === '28P01') {
      console.error('\n🔧 Troubleshooting authentication:');
      console.error('1. Verify database username and password');
      console.error('2. Check if user has proper permissions');
    }
    
    return false;
  }
}

// ✅ Added: Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}

export default pool;