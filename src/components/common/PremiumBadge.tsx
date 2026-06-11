'use client';

import { Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@auth0/nextjs-auth0/types';
import { getPremiumMemberType, getPremiumMemberLabel } from '@/lib/userUtils';
import { useAdminStatus } from '@/hooks/useAdminStatus';

type PremiumBadgeProps = {
  user: User | null | undefined;
  variant?: 'default' | 'large';
  showIcon?: boolean;
};

export default function PremiumBadge({
  user,
  variant = 'default',
  showIcon = true,
}: PremiumBadgeProps) {
  const { isAdmin } = useAdminStatus();
  const memberType = getPremiumMemberType(user, isAdmin);
  const label = getPremiumMemberLabel(user, isAdmin);

  if (!label) {
    return null;
  }

  const getIcon = () => {
    if (!showIcon) return null;
    switch (memberType) {
      case 'admin':
        return <Shield size={variant === 'large' ? 16 : 12} className="mr-1" />;
      case 'premium':
        return <Crown size={variant === 'large' ? 16 : 12} className="mr-1" />;
      default:
        return null;
    }
  };

  const getColorClass = () => {
    switch (memberType) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'premium':
        return 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white';
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white';
    }
  };

  return (
    <Badge
      className={`
        ${getColorClass()}
        ${variant === 'large' ? 'text-sm py-1 px-3' : 'text-xs'}
        font-medium flex items-center w-fit
      `}
    >
      {getIcon()}
      {label}
    </Badge>
  );
}
