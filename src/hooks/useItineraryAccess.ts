import type { User } from '@auth0/nextjs-auth0/types';

type ItineraryMetadata = {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  owner: { id: string; name: string; email: string };
  sharedWith?: { id: string; name: string; email: string }[];
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
  const isOwner = user && metadata.owner && user.sub === metadata.owner.id;
  const isSharedWithUser =
    user &&
    metadata.sharedWith &&
    metadata.sharedWith.some((sharedUser) => sharedUser.id === user.sub);

  const hasAccess = isPublic || Boolean(isOwner) || Boolean(isSharedWithUser);
  const needsLogin = !hasAccess && !user;

  return {
    hasAccess,
    isOwner: Boolean(isOwner),
    isPublic,
    isSharedWithUser: Boolean(isSharedWithUser),
    needsLogin,
  };
};
