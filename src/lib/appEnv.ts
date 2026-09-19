/**
 * 実行環境の名前（production / preview / development）。
 *
 * Vercel では `VERCEL_ENV` が自動で入るが、セルフホスト（VPS の Docker）では空になる。
 * そのままだと「本番なのに本番扱いされない」ため、`APP_ENV` で明示できるようにする。
 * Vercel 側は `APP_ENV` を設定しなければ従来どおり `VERCEL_ENV` で動く。
 *
 * 注意: `next.config.mjs` は素の ESM でこのファイルを読めないため、同じ判定を直接書いている。
 * どちらかを変えるときは両方を合わせること。
 */
export function getAppEnv(): string {
  return process.env.APP_ENV ?? process.env.VERCEL_ENV ?? 'development';
}

export function isProductionEnv(): boolean {
  return getAppEnv() === 'production';
}
