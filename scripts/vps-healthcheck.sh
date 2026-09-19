#!/usr/bin/env bash
# VPS 上で systemd タイマーから定期実行し、応答しなくなったコンテナを再起動する。
#
# 背景: 素の Docker は、ヘルスチェックが unhealthy になってもコンテナを再起動しない
# （再起動するのは Swarm のみ）。プロセスが生きたまま応答しなくなる場合に備える。
#
# 導入（VPS 上で root として）:
#   sudo install -m 755 vps-healthcheck.sh /usr/local/bin/tns-web-healthcheck
#   sudo systemctl enable --now tns-web-healthcheck.timer
#
# 誤検知での再起動を避けるため、2回続けて異常だった場合のみ再起動する。
set -uo pipefail

CONTAINER="${CONTAINER:-tns-web-app-1}"
STATE_FILE="/run/tns-web-healthcheck.state"

status=$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
running=$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo "false")

if [[ "$status" == "healthy" ]]; then
  rm -f "$STATE_FILE"
  exit 0
fi

# コンテナが存在しない、または停止している場合は再起動ポリシーに任せる（手動停止の可能性がある）
if [[ "$status" == "missing" || "$running" != "true" ]]; then
  echo "コンテナ $CONTAINER が動いていません（status=$status running=$running）。再起動ポリシーに任せます。"
  exit 0
fi

prev=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
count=$((prev + 1))
echo "$count" > "$STATE_FILE"

if [[ "$count" -lt 2 ]]; then
  echo "$CONTAINER が $status です（1回目）。次回も異常なら再起動します。"
  exit 0
fi

echo "$CONTAINER が $status のままなので再起動します（$count 回連続）。"
docker restart "$CONTAINER"
rm -f "$STATE_FILE"
