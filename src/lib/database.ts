import mongoose from 'mongoose';

/**
 * Ensures that a MongoDB connection is established
 *
 * This function handles connection states:
 * - If disconnected (readyState = 0): Establishes a new connection
 * - If connecting (readyState = 2): Waits for the connection to complete
 * - If connected (readyState = 1): Does nothing
 *
 * @throws {Error} If connection fails or times out
 */
export async function ensureDbConnection() {
  try {
    if (mongoose.connection.readyState === 0) {
      // データベース名は MONGODB_URI から自動取得
      const uri = process.env.MONGODB_URI!;

      // Enhanced connection options for stability in various environments
      await mongoose.connect(uri, {
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
        serverSelectionTimeoutMS: 10000, // 10 seconds
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Maintain a minimum of 2 socket connections
      });

      console.log('MongoDB connection established successfully');
    } else if (mongoose.connection.readyState === 2) {
      // Connection is connecting, wait for it
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 15000);

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });

        mongoose.connection.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      readyState: mongoose.connection.readyState,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side',
    });
    throw new Error(
      `Database connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
