declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      USE_RDS?: 'true' | 'false';
      DATABASE_URL?: string;
      DATABASE_URL_RDS?: string;
      POSTGRES_URL?: string;
      POSTGRES_URL_RDS?: string;
      POSTGRES_PRISMA_URL?: string;
      POSTGRES_PRISMA_URL_RDS?: string;
      POSTGRES_URL_NON_POOLING?: string;
      POSTGRES_URL_NON_POOLING_RDS?: string;
      POSTGRES_USER?: string;
      POSTGRES_PASSWORD?: string;
      POSTGRES_HOST?: string;
      POSTGRES_DATABASE?: string;
      LOG_LEVEL?: 'info' | 'debug' | 'error';
      MLS_API_URL?: string;
      MLS_API_TOKEN?: string;
    }
  }
}

export {};