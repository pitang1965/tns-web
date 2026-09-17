# syntax=docker/dockerfile:1

# セルフホスト用の本番イメージ（Next.js standalone 出力）。
# 使い方と経緯は docs/self-hosting/poc-log.md を参照。

FROM node:22.17.0-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- 依存の取得 ----
FROM base AS deps
RUN npm install -g pnpm@10.19.0
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- ビルド ----
FROM deps AS builder
COPY . .
ENV BUILD_STANDALONE=1
# 環境変数ファイルは BuildKit の secret としてビルド中だけマウントし、レイヤーに残さない。
# ビルド時に必要な理由:
# - NEXT_PUBLIC_* と next.config.mjs はビルド時に評価される
# - generateStaticParams を持つページ（/shachu-haku/[spotId]）がビルド時に DB を読む
# Next は読み込んだ .env* を standalone ディレクトリへコピーするため、ビルド直後に消す。
RUN --mount=type=secret,id=buildenv,target=/app/.env.production.local \
    pnpm build \
    && rm -f .next/standalone/.env*

# ---- 実行 ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone 出力には public/ と .next/static が含まれないので個別にコピーする。
# ISR のキャッシュが .next 配下に書き込まれるため、node ユーザーの所有にする。
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
