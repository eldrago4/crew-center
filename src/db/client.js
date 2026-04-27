import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL, {
    connectTimeoutMillis: 10000, // 10s connection timeout to handle cold starts
    idleTimeoutMillis: 60000, // 1min idle timeout to align with scale to zero
    max: 10, // Connection pool max
    min: 0, // Scale to zero
    acquireTimeoutMillis: 60000, // 1min acquire timeout
    createTimeoutMillis: 30000, // 30s create timeout
    destroyTimeoutMillis: 5000, // 5s destroy timeout
    reapIntervalMillis: 1000, // Reap interval
    createRetryIntervalMillis: 200, // Retry interval
});

const db = drizzle(sql, { schema });

export default db;
