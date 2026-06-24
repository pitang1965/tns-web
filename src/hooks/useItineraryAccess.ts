import type { User } from '@auth0/nextjs-auth0/types';

type ItineraryMetadata = {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  // 生PII（owner/sharedWith）はクライアントへ渡さず、サーバー側で算出した
  // 所有者・共有判定の boolean のみを受け取る。詳細は
  // docs/adr/0003-public-creator-handle.md（残課題S2）を参照。
  isOwner: boolean;
  isSharedWith: boolean;
  totalDays: number;
  createdAt?: string;
  updatedAt?: string;
  dayPlanSummaries: { date: string | null; notes?: string }[];
};

type UseItineraryAccessProps = {
  user: User | null | undefined;
  metadata: ItineraryMetadata | null | undefined;
};

export const useItineraryAccess = ({
  user,
  metadata,
}: UseItineraryAccessProps) => {
  if (!metadata) {
    return {
      hasAccess: false,
      isOwner: false,
      isPublic: false,
      isSharedWithUser: false,
      needsLogin: false,
    };
  }

  const isPublic = metadata.isPublic;
  // サーバー側で算出済みの boolean を使用する。ただしキャッシュ（IndexedDB）の
  // 値はキャッシュ時点のセッションに基づくため、ログアウト後に所有者UIが
  // 誤表示されないよう、現在ログイン中である場合のみ true とみなす。
  const isOwner = Boolean(user) && Boolean(metadata.isOwner);
  const isSharedWithUser = Boolean(user) && Boolean(metadata.isSharedWith);

  const hasAccess = isPublic || isOwner || isSharedWithUser;
  const needsLogin = !hasAccess && !user;

  return {
    hasAccess,
    isOwner: Boolean(isOwner),
    isPublic,
    isSharedWithUser: Boolean(isSharedWithUser),
    needsLogin,
  };
};
