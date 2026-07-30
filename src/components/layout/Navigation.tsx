'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import {
  Info,
  BookHeart,
  MapPin,
  ChevronDown,
  Shield,
  Users,
  Coins,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { UpdatesUnreadDot } from '@/components/updates/UpdatesUnreadDot';

const activeClassNames =
  'underline decoration-1 underline-offset-4 decoration-current';

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center ${isActive ? activeClassNames : ''}`}
    >
      {children}
    </Link>
  );
};

export function Navigation() {
  const { isLoading } = useUser();
  const { isAdmin: userIsAdmin } = useAdminStatus();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 一般機能はトップレベルの直リンク。管理者用は「管理」ドロップダウンに集約する。
  return (
    <div className="flex items-center space-x-4">
      <NavLink href="/">
        <Info className="mr-1" />
        情報
        <UpdatesUnreadDot className="ml-1" />
      </NavLink>

      <NavLink href="/itineraries">
        <BookHeart className="mr-1" />
        旅程
      </NavLink>

      <NavLink href="/shachu-haku">
        <MapPin className="mr-1" />
        車中泊スポット
      </NavLink>

      {userIsAdmin && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label="管理メニュー"
            className="flex items-center hover:underline hover:decoration-1 hover:underline-offset-4 hover:decoration-current outline-none cursor-pointer"
          >
            <Shield className="mr-1" />
            管理
            <ChevronDown className="ml-1 h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/itineraries"
                className="flex items-center w-full"
              >
                <BookHeart className="mr-1 h-4 w-4" />
                旅程
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/shachu-haku"
                className="flex items-center w-full"
              >
                <MapPin className="mr-1 h-4 w-4" />
                車中泊
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/submissions"
                className="flex items-center w-full"
              >
                <Users className="mr-1 h-4 w-4" />
                投稿管理
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/points" className="flex items-center w-full">
                <Coins className="mr-1 h-4 w-4" />
                アズキ付与
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
