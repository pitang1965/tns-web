import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@/app/config/sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('@/app/config/sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
