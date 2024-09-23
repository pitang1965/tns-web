import * as Sentry from '@sentry/nextjs';

export interface Logger {
  error(error: Error, extraInfo?: Record<string, any>): void;
  info(message: string, extraInfo?: Record<string, any>): void;
  warn(message: string, extraInfo?: Record<string, any>): void;
  debug(message: string, extraInfo?: Record<string, any>): void;
}

class SentryLogger implements Logger {
  error(error: Error, extraInfo: Record<string, any> = {}) {
    Sentry.withScope((scope) => {
      Object.entries(extraInfo).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  }

  info(message: string, extraInfo: Record<string, any> = {}) {
    this.logMessage(message, 'info', extraInfo);
  }

  warn(message: string, extraInfo: Record<string, any> = {}) {
    this.logMessage(message, 'warning', extraInfo);
  }

  debug(message: string, extraInfo: Record<string, any> = {}) {
    this.logMessage(message, 'debug', extraInfo);
  }

  private logMessage(
    message: string,
    level: Sentry.SeverityLevel,
    extraInfo: Record<string, any>
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
