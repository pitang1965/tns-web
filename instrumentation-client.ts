// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://8eafcbf664887d63e9d88ed235f4626e@o4507994894434304.ingest.de.sentry.io/4507994900791376',
  enabled: process.env.NODE_ENV === 'production', // 本番環境のみSentryを有効化
  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out known In-App Browser errors
  beforeSend(event) {
    // Filter out postMessage errors from In-App Browsers (Facebook, Instagram, etc.)
    if (event.exception?.values?.[0]?.value?.includes('postMessage: Java object is gone')) {
      return null; // Don't send this error to Sentry
    }

    // Filter out other common In-App Browser WebView errors
    const errorMessage = event.exception?.values?.[0]?.value?.toLowerCase();
    if (errorMessage?.includes('java object is gone') ||
        errorMessage?.includes('webview') && errorMessage?.includes('gone')) {
      return null;
    }

    // Add browser context for debugging
    if (typeof navigator !== 'undefined') {
      event.contexts = event.contexts || {};
      event.contexts.browser_details = {
        userAgent: navigator.userAgent,
        isFacebookBrowser: /FBAN|FBAV/.test(navigator.userAgent),
        isInstagramBrowser: /Instagram/.test(navigator.userAgent),
        isLineBrowser: /Line/.test(navigator.userAgent),
        isTwitterBrowser: /Twitter/.test(navigator.userAgent),
      };
    }

    return event;
  },
});

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
