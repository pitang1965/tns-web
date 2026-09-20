#!/usr/bin/env bash
# 開発PCから VPS へデプロイする。
#
#   bash scripts/deploy-vps.sh              # 通常のデプロイ
#   bash scripts/deploy-vps.sh --rollback   # 直前の版に戻す
#
# 流れ:
#   1. 開発PCでイメージをビルド（VPS の CPU を使わないので、サイトの応答が落ちない）
#   2. docker save で固めて SSH で送り、VPS 側で load
#   3. 入れ替えて、/api/health が正常になるまで待つ
#   4. 正常にならなければ、直前の版へ自動で戻す
#
# 前提:
#   - .env.deploy.vps に接続先と、ビルドに使う環境変数ファイルの場所を書く（Git 管理外）
#   - ビルド用の環境変数ファイル（本番用）は開発PC側に置く。VPS には実行用の .env.docker を別途置く
set -euo pipefail

cd "$(dirname "$0")/.."

CONF=".env.deploy.vps"
if [[ ! -f "$CONF" ]]; then
  echo "設定ファイル $CONF がありません。次の内容で作成してください:" >&2
  cat >&2 <<'SAMPLE'
  VPS_HOST=deploy@<VPSのIP>
  VPS_SSH_KEY=~/.ssh/id_ed25519_conoha
  VPS_APP_DIR=~/apps/tns-web
  BUILD_ENV_FILE=.env.production.vps   # ビルド時に読ませる環境変数ファイル（開発PC側）
  HEALTH_URL=https://vps.over40web.club/api/health
SAMPLE
  exit 1
fi
# set -a を付けて読み込む。export しないと、compose の子プロセスに BUILD_ENV_FILE が渡らず、
# secret に既定値（.env.docker＝開発用）が使われてビルド結果が開発用になる（2026-09-20 に判明）
set -a
# shellcheck disable=SC1090
source <(tr -d '\r' < "$CONF" | grep -E '^[A-Z0-9_]+=')
set +a

SSH="ssh -i ${VPS_SSH_KEY/#\~/$HOME} -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=30"
REMOTE="$SSH $VPS_HOST"

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# 健全性の確認。healthy になるまで最大 90 秒待つ
wait_healthy() {
  local i
  for i in $(seq 1 45); do
    if $REMOTE "docker inspect -f '{{.State.Health.Status}}' tns-web-app-1 2>/dev/null" | grep -q healthy; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# 外からの応答も確認する（トンネル・Cloudflare まで含めた確認）
check_public() {
  [[ -z "${HEALTH_URL:-}" ]] && return 0
  local args=()
  if [[ -f .env.access ]]; then
    # Cloudflare Access で保護している場合はサービストークンを付ける
    local id secret
    id=$(tr -d '\r' < .env.access | sed -n 's/^CF_ACCESS_CLIENT_ID=//p')
    secret=$(tr -d '\r' < .env.access | sed -n 's/^CF_ACCESS_CLIENT_SECRET=//p')
    [[ -n "$id" ]] && args+=(-H "CF-Access-Client-Id: $id" -H "CF-Access-Client-Secret: $secret")
  fi
  local out code
  out=$(mktemp)
  # 失敗しても止めない（呼び出し側で判定する）
  code=$(curl -s -o "$out" -w '%{http_code}' --max-time 20 "${args[@]}" "$HEALTH_URL" || echo 000)
  rm -f "$out"
  echo "$code"
}

# 現在動いている版（切り戻し先）
current_tag() {
  $REMOTE "docker inspect -f '{{index .Config.Labels \"app.image.tag\"}}' tns-web-app-1 2>/dev/null" | tr -d '\r'
}

rollback_to() {
  local tag="$1"
  log "切り戻し: $tag"
  $REMOTE "cd $VPS_APP_DIR && APP_IMAGE_TAG='$tag' docker compose up -d app"
  if ! wait_healthy; then
    echo "切り戻しても healthy になりません。手動で確認してください。" >&2
    exit 1
  fi
  local code
  code=$(check_public)
  if [[ "$code" == "200" ]]; then
    echo "切り戻し完了（$tag）。外からの応答 $code"
  else
    # コンテナは healthy なので、外からの確認の設定（HEALTH_URL や Access）が疑わしい
    echo "切り戻し完了（$tag）。ただし外からの応答は $code（コンテナは healthy）。HEALTH_URL の設定を確認してください。" >&2
  fi
}

# --- 切り戻しのみ ---
if [[ "${1:-}" == "--rollback" ]]; then
  PREV=$($REMOTE "cat $VPS_APP_DIR/.deploy-previous-tag 2>/dev/null" | tr -d '\r')
  [[ -z "$PREV" ]] && { echo "直前の版の記録（.deploy-previous-tag）がありません" >&2; exit 1; }
  rollback_to "$PREV"
  exit 0
fi

# --- 通常のデプロイ ---
TAG=$(git rev-parse --short HEAD)
[[ -n "$(git status --porcelain)" ]] && TAG="${TAG}-dirty"
PREV_TAG=$(current_tag)
log "デプロイする版: $TAG（現在: ${PREV_TAG:-不明}）"

log "1/5 開発PCでビルド"
# next.config.mjs は .env* より先に評価されるので、APP_ENV はビルド引数として渡す
APP_ENV=$(sed -n 's/^APP_ENV=//p' "$BUILD_ENV_FILE" | tr -d '\r' | sed -E "s/^['\"](.*)['\"]$/\1/")
# 環境変数ファイルの中身が変わったらビルドし直す（BuildKit の secret はキャッシュキーに含まれないため）
ENV_HASH=$(sha256sum "$BUILD_ENV_FILE" | cut -c1-16)
echo "  APP_ENV=${APP_ENV:-（未設定）} / 環境変数ファイル=${BUILD_ENV_FILE}（$ENV_HASH）"
APP_IMAGE_TAG="$TAG" APP_ENV="$APP_ENV" ENV_HASH="$ENV_HASH" docker compose build app

log "2/5 イメージを VPS へ転送"
docker save "tns-web:$TAG" | gzip -1 | $REMOTE "gunzip | docker load"

log "3/5 入れ替え"
# compose.yaml を手元の内容に合わせる（VPS 側が古いと、ラベルや設定の変更が反映されない）
scp -i "${VPS_SSH_KEY/#\~/$HOME}" -o BatchMode=yes compose.yaml "$VPS_HOST:$VPS_APP_DIR/compose.yaml" >/dev/null
$REMOTE "cd $VPS_APP_DIR && echo '${PREV_TAG:-}' > .deploy-previous-tag && APP_IMAGE_TAG='$TAG' docker compose up -d app"

log "4/5 健全性の確認"
if ! wait_healthy; then
  echo "healthy になりませんでした。" >&2
  [[ -n "$PREV_TAG" ]] && rollback_to "$PREV_TAG"
  exit 1
fi

CODE=$(check_public)
if [[ "$CODE" != "200" ]]; then
  echo "外からの応答が $CODE でした。" >&2
  [[ -n "$PREV_TAG" ]] && rollback_to "$PREV_TAG"
  exit 1
fi

log "5/5 完了: $TAG（外からの応答 $CODE）"
$REMOTE "cd $VPS_APP_DIR && docker image prune -f >/dev/null; docker images tns-web --format '  残っている版: {{.Tag}} ({{.Size}})'"
echo "  切り戻すときは: bash scripts/deploy-vps.sh --rollback"
