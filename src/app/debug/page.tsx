'use client';

import * as Sentry from "@sentry/nextjs";

export default function DebugPage() {
  const testSentryLog = () => {
    Sentry.logger.info('User triggered test log', { log_source: 'sentry_test' });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Debug Page</h1>
      <button 
        onClick={testSentryLog}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Test Sentry Log
      </button>
    </div>
  );
}