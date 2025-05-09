// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8eafcbf664887d63e9d88ed235f4626e@o4507994894434304.ingest.de.sentry.io/4507994900791376",
  enabled: process.env.NODE_ENV === "production", // 本番環境のみSentryを有効化

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
