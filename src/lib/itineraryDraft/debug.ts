/**
 * 旅程ドラフト生成の診断ログ。開発時のみ出力し、本番では黙る。
 * （48秒問題やジオコーディングの切り分けに使った一時ログの集約先）
 */
export function draftLog(label: string, data: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[draft] ${label}`, data);
  }
}
