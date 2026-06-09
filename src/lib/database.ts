import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

declare global {
  var _mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const cached = global._mongooseCache;

function getMongoUri(): string {
  const appUri = process.env.APP_MONGODB_URI;
  if (appUri) return appUri;
  const uri = process.env.MONGODB_URI;
  if (uri) return uri;
  throw new Error(
    'Invalid/Missing environment variable: "APP_MONGODB_URI" or "MONGODB_URI"',
  );
}

const connectionOptions = {
  maxPoolSize: 3,
  minPoolSize: 0,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  autoIndex: process.env.NODE_ENV !== 'production',
};

export async function ensureDbConnection(): Promise<void> {
  if (cached.conn) return;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), connectionOptions);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error(
      error instanceof Error
        ? error
        : new Error('Failed to establish MongoDB connection'),
      { readyState: mongoose.connection.readyState },
    );
    throw new Error(
      `Database connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
