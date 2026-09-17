// APP_BASE_URL はカンマ区切りで複数指定できる（Auth0 SDK がリクエストのホストに合うものを選ぶ）。
// 例: セルフホストで localhost と staging を併用する場合
//   APP_BASE_URL=http://localhost:3000,https://staging.over40web.club
// リクエストに結び付かない場面（メール本文のリンクなど）では先頭の値を正とする。
export function getPrimaryAppBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? '').split(',')[0].trim();
}
