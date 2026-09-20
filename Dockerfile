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
# APP_ENV はビルド引数で渡す。
# next.config.mjs は .env* が読み込まれる前に評価されるため、環境変数ファイルに書くだけでは
# CSP のレポート環境名や vercel.live の許可が本番扱いにならない（2026-09-20 に判明）。
ARG APP_ENV=
ENV APP_ENV=${APP_ENV}
# 環境変数ファイルの中身が変わってもビルドキャッシュは無効にならない（BuildKit の secret は
# キャッシュキーに含まれない）。開発用の設定でビルドした結果が使い回され、
# NEXT_PUBLIC_* の埋め込みや sitemap の事前生成が古いままになる（2026-09-20 に判明）。
# そのため、ファイルのハッシュを引数で渡して変更を検知させる。
# 注意: ARG は「使われて」いないとキャッシュの判定に含まれないため、ENV で参照する
ARG ENV_HASH=
ENV ENV_HASH=${ENV_HASH}
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
