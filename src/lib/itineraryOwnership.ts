/**
 * 旅程の所有者判定を一箇所に集約するモジュール。
 *
 * 背景:
 * owner.id には Auth0 の sub が入るが、sub は「接続ごと」に別の値になる
 * （google-oauth2|… / auth0|… / line|…）。そのため同じ人でもログイン方法を変えると
 * 別アカウント扱いになり、自分の旅程が一覧から消える。2026-09-12 に本番で実際に確認した
 * （メールログインと Google ログインで旅程が別々に見えていた）。
 *
 * 方針:
 * アズキの残高が正規化メールを一次キーにしている（ADR-0010）のと同じ考え方で、
 * 「認証済みの同一メールアドレス」も所有の根拠として認める。
 *
 * email_verified を必須にしている理由:
 * このゲートが無いと、他人のメールアドレスでデータベース接続に新規登録するだけで、
 * その人の旅程を閲覧・編集・削除できてしまう。アズキが同じゲートを掛けているのと同じ理由。
 *
 * 安全性:
 * owner.id による一致は従来どおり常に有効なので、この仕組みは純粋な上乗せであり、
 * 既存の所有関係を壊さない。メールの大文字小文字が既存データと食い違う場合も、
 * 単に上乗せ分が効かないだけで、従来と同じ挙動に戻るだけである。
 */

/** セッションユーザーのうち、所有者判定に使う部分だけを表す型 */
export type OwnerIdentity = {
  sub?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
};

/** 旅程ドキュメントの owner のうち、所有者判定に使う部分だけを表す型 */
export type OwnerRef =
  | { id?: string | null; email?: string | null }
  | null
  | undefined;

/**
 * メールアドレスを正規化する。
 * src/lib/points/points.ts の normalizeEmail と同じ規則に揃えること。
 */
export function normalizeOwnerEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * 所有の根拠として使ってよいメールアドレスを返す。
 * 未認証（email_verified !== true）や未設定の場合は null。
 */
export function ownerEmailOf(
  user: OwnerIdentity | null | undefined,
): string | null {
  if (!user?.email_verified) return null;
  return normalizeOwnerEmail(user.email) || null;
}

/**
 * MongoDB の所有者一致条件を組み立てる。
 * `{ _id: id, ...ownerQuery(user) }` のように他の条件と合成して使う。
 *
 * 認証情報が無い場合は「どの文書にも一致しない条件」を返す。
 * 条件が空オブジェクトになると全件一致してしまい、事故が致命的になるため。
 */
export function ownerQuery(
  user: OwnerIdentity | null | undefined,
): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (user?.sub) {
    conditions.push({ 'owner.id': user.sub });
  }

  const email = ownerEmailOf(user);
  if (email) {
    conditions.push({ 'owner.email': email });
  }

  if (conditions.length === 0) return { 'owner.id': { $in: [] } };
  if (conditions.length === 1) return conditions[0];
  return { $or: conditions };
}

/**
 * 取得済みのドキュメントに対してメモリ上で所有者判定を行う。
 * サーバー・クライアントのどちらからも使える（外部依存を持たせないこと）。
 */
export function isOwnedBy(
  owner: OwnerRef,
  user: OwnerIdentity | null | undefined,
): boolean {
  if (!owner || !user) return false;

  if (owner.id && user.sub && owner.id === user.sub) return true;

  const email = ownerEmailOf(user);
  return Boolean(email && normalizeOwnerEmail(owner.email) === email);
}
