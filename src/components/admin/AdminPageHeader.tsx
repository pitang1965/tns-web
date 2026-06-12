import { ReactNode } from 'react';

type AdminPageHeaderProps = {
  children: ReactNode;
  className?: string;
};

// 管理者専用ページの目印となる黄色いヘッダーバンド
export function AdminPageHeader({
  children,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <div
      className={`bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-3 ${className}`}
    >
      {children}
    </div>
  );
}
