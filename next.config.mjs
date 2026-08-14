import { withSentryConfig } from '@sentry/nextjs';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  fallbacks: {
    // 静的HTMLファイルをフォールバックに使用
    // Next.jsのforce-dynamic（Cache-Control: no-store）の影響を受けない
    document: '/offline.html',
  },
  // キャッシュ戦略
  runtimeCaching: [
    // Mapbox静的アセット（スタイル、フォント、スプライト）
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/(styles|fonts|sprites)\/.*$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-static-assets',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
      },
    },
    // Mapboxベクトルタイル
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/v4\/.*\.vector\.pbf/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-tiles',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
      },
    },
    // Mapboxラスタータイル（画像タイル）
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/.*\.(png|jpg|jpeg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-raster-tiles',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1週間
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1週間
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: 'CacheFirst',
      options: {
        rangeRequests: true,
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
      },
    },
    {
      // Next.jsの静的JSファイル（ハッシュ付き）は長期キャッシュOK
      urlPattern: /\/_next\/static\/.+\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年（ハッシュが変わるため安全）
        },
      },
    },
    {
      // その他のJSファイルは短期キャッシュ
      urlPattern: /\.(?:js)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1時間（デプロイ後に更新されるように）
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      // Next.jsの静的CSSファイル（ハッシュ付き）は長期キャッシュOK
      urlPattern: /\/_next\/static\/.+\.css$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-css-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年（ハッシュが変わるため安全）
        },
      },
    },
    {
      // その他のCSSファイルは短期キャッシュ
      urlPattern: /\.(?:css|less)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1時間
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      // 車中泊スポット一覧・地図データ - StaleWhileRevalidate（即座に表示、バックグラウンド更新）
      urlPattern: /\/_next\/data\/.+\/shachu-haku\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'shachu-haku-list-data',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 60, // 30分
        },
      },
    },
    {
      // 車中泊スポット詳細データ - StaleWhileRevalidate
      urlPattern: /\/_next\/data\/.+\/shachu-haku\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'shachu-haku-detail-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 60, // 30分
        },
      },
    },
    {
      // 旅程一覧データ - StaleWhileRevalidate（即座に表示、バックグラウンド更新）
      urlPattern: /\/_next\/data\/.+\/itineraries\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'itinerary-list-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
      },
    },
    {
      // 旅程詳細データ - StaleWhileRevalidate（1日キャッシュ）
      urlPattern: /\/_next\/data\/.+\/itineraries\/.+\.json$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'itinerary-detail-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
      },
    },
    {
      // その他のNext.jsデータ - NetworkFirst（既存の動作維持）
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60, // 1分のみ（頻繁に更新される可能性があるため）
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      // 車中泊スポット一覧API - StaleWhileRevalidate
      urlPattern: /\/api\/camping-spots\/?$/i,
      handler: 'StaleWhileRevalidate',
      method: 'GET',
      options: {
        cacheName: 'shachu-haku-list-api',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 60, // 30分
        },
      },
    },
    {
      // その他の車中泊スポットAPI - StaleWhileRevalidate
      urlPattern: /\/api\/camping-spots\/.+$/i,
      handler: 'StaleWhileRevalidate',
      method: 'GET',
      options: {
        cacheName: 'shachu-haku-detail-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 60, // 30分
        },
      },
    },
    {
      // 旅程API - StaleWhileRevalidate（1日キャッシュ）
      urlPattern: /\/api\/itineraries\/.*$/i,
      handler: 'StaleWhileRevalidate',
      method: 'GET',
      options: {
        cacheName: 'itinerary-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
      },
    },
    {
      // その他のAPI - NetworkFirst（既存の動作維持）
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 5 * 60, // 5分（APIは新鮮なデータを返すべき）
        },
        networkTimeoutSeconds: 10, // 10秒でタイムアウト後、キャッシュを使用
      },
    },
    {
      // HTMLページはネットワーク優先でキャッシュ（オフライン対応）
      urlPattern: ({ request, url }) => {
        // HTMLドキュメントのみマッチ（Accept: text/html）
        return request.destination === 'document';
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24時間（オフライン時にアプリシェルを提供するため）
        },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

// Auth0テナントのドメイン（例: https://xxx.jp.auth0.com）を環境変数から取得。
// ログイン時のフォーム送信先（form-action）としてのみCSPに許可する。
// @auth0/nextjs-auth0 はフルページリダイレクト＋サーバ側トークン交換のため、
// ブラウザから issuer への fetch も iframe 埋め込みも行わない（connect/frame は不要）。
const authIssuer = process.env.AUTH0_ISSUER_BASE_URL || '';

// PostHog のホスト。リバースプロキシ利用時は NEXT_PUBLIC_POSTHOG_HOST を尊重する。
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// AdSense が接続・描画・不正検証で使う Google 系オリジン群。
// 注意: 'https://*.google.com' は apex の google.com にも .adtrafficquality.google
// にもマッチしないため、それらを明示的に列挙する必要がある。
const googleAdOrigins = [
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.g.doubleclick.net',
  'https://*.doubleclick.net',
  'https://google.com',
  'https://*.google.com',
  'https://*.adtrafficquality.google',
  // AdSense が計測ビーコン(CSI)・静的アセットで使う Google 静的ホスト（csi.gstatic.com 等）
  'https://*.gstatic.com',
].join(' ');

// Sentry の CSP 違反レポート受信エンドポイント。
// DSN は instrumentation-client.ts と同一（公開鍵でありシークレットではない）。EUリージョン(.de)。
// 形式: https://o<org>.ingest.<region>.sentry.io/api/<project>/security/?sentry_key=<publicKey>
const sentryCspReportUri =
  'https://o4507994894434304.ingest.de.sentry.io/api/4507994900791376/security/?sentry_key=8eafcbf664887d63e9d88ed235f4626e';

// Vercel のプレビュー用ツールバー（Live Feedback）は preview/development デプロイにだけ
// 自動注入され、本番（VERCEL_ENV === 'production'）には読み込まれない。
// そのため vercel.live 関連の許可はプレビュー時のみ付与し、本番CSPはタイトに保つ。
// （img-src は 'https:' で広く許可済みのため vercel.live/vercel.com は追加不要）
const isVercelProd = process.env.VERCEL_ENV === 'production';
const vercelLiveScript = isVercelProd ? '' : ' https://vercel.live';
const vercelLiveStyle = isVercelProd ? '' : ' https://vercel.live';
const vercelLiveFont = isVercelProd ? '' : ' https://vercel.live https://assets.vercel.com';
const vercelLiveConnect = isVercelProd
  ? ''
  : ' https://vercel.live wss://ws-us3.pusher.com https://*.pusher.com';
const vercelLiveFrame = isVercelProd ? '' : ' https://vercel.live';

// Content-Security-Policy のディレクティブ。
// まずは Report-Only で導入し、Sentry に集約される違反レポートを見ながら
// 穴を塞いだうえで本適用（Content-Security-Policy）へ切り替える方針。
//
// 各ソースの根拠:
// - googleAdOrigins                    : AdSense
// - posthogHost / us-assets.posthog.com: PostHog アクセス解析（本番のみ動作）
// - api.mapbox.com / events.mapbox.com : Mapbox のタイル・スタイル・テレメトリ
// - authIssuer                          : Auth0 ログイン（form-action のみ）
// - フォントは next/font で自己ホストするため Google Fonts への接続は不要
// - Sentry はtunnelRoute（/monitoring）経由のため 'self' で足りる
const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // クリックジャッキング対策（X-Frame-Options のCSP版）
  "frame-ancestors 'self'",
  `form-action 'self' ${authIssuer}`.trim(),
  // Next.js のインラインスクリプトと Mapbox GL のWorker生成のため unsafe-inline / unsafe-eval が必要
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${googleAdOrigins} ${posthogHost} https://us-assets.i.posthog.com https://api.mapbox.com${vercelLiveScript}`,
  `style-src 'self' 'unsafe-inline' https://api.mapbox.com${vercelLiveStyle}`,
  // 地図タイル・アバター・広告・アフィリエイト画像など多様なため https: を広めに許可
  "img-src 'self' data: blob: https:",
  `font-src 'self' data:${vercelLiveFont}`,
  // Service Worker（PWA）と Mapbox GL のWorkerが blob: を使う
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `connect-src 'self' https://api.mapbox.com https://events.mapbox.com ${posthogHost} https://us-assets.i.posthog.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io ${googleAdOrigins}${vercelLiveConnect}`,
  `frame-src 'self' ${googleAdOrigins} https://social-plugins.line.me${vercelLiveFrame}`,
  // 本適用時のみ有効（Report-Only では無視される）
  'upgrade-insecure-requests',
  // 違反レポートの送信先（report-to は Reporting-Endpoints ヘッダーの csp-endpoint を参照）。
  // 新しいブラウザは report-to を、古いブラウザは report-uri を使う。
  `report-uri ${sentryCspReportUri}`,
  'report-to csp-endpoint',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: {
    compilationMode: 'annotation',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // クリックジャッキング対策
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // MIMEスニッフィング対策
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // リファラーポリシー
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 不要なブラウザ機能を制限（位置情報はMapbox使用のため除外）
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
          // HTTPS強制（HSTS）。まずはincludeSubDomains/preloadなしで tabi.over40web.club 単体に適用。
          // 他サブドメインへの影響がないと確認できたら includeSubDomains; preload を検討する。
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // CSP の report-to が参照するレポート送信先グループの定義（Sentry）。
          {
            key: 'Reporting-Endpoints',
            value: `csp-endpoint="${sentryCspReportUri}"`,
          },
          // CSPはまず違反を計測するだけの Report-Only で導入（既存機能をブロックしない）。
          // 違反レポートは Sentry に集約される。問題ないと確認できたら 'Content-Security-Policy' に切り替える。
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'tabi-no-shiori.vercel.app',
          },
        ],
        destination: 'https://tabi.over40web.club/:path*',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(withPWA(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'shoji-makino',
  project: 'tabi-no-shiori',
  sentryUrl: 'https://sentry.io/',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
