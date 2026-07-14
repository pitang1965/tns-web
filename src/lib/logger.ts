import * as Sentry from '@sentry/nextjs';

export type Logger = {
  error(error: Error, extraInfo?: Record<string, unknown>): void;
  info(message: string, extraInfo?: Record<string, unknown>): void;
  warn(message: string, extraInfo?: Record<string, unknown>): void;
  debug(message: string, extraInfo?: Record<string, unknown>): void;
};

class SentryLogger implements Logger {
  error(error: Error, extraInfo: Record<string, unknown> = {}) {
    Sentry.withScope((scope) => {
      Object.entries(extraInfo).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  }

  info(message: string, extraInfo: Record<string, unknown> = {}) {
    this.logMessage(message, 'info', extraInfo);
  }

  warn(message: string, extraInfo: Record<string, unknown> = {}) {
    this.logMessage(message, 'warning', extraInfo);
  }

  debug(message: string, extraInfo: Record<string, unknown> = {}) {
    this.logMessage(message, 'debug', extraInfo);
  }

  private logMessage(
    message: string,
    level: Sentry.SeverityLevel,
    extraInfo: Record<string, unknown>,
  ) {
    Sentry.withScope((scope) => {
      Object.entries(extraInfo).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }
}

export const logger: Logger = new SentryLogger();
