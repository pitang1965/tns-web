'use client';

import Link from 'next/link';
import { Sparkles, Bug, Settings2, ArrowRight, LucideIcon } from 'lucide-react';
import {
  updateNotes,
  updateCategoryLabel,
  type UpdateCategory,
  type UpdateEntry,
} from '@/data/updateNotes';
import { useUpdatesHighlight } from '@/hooks/useUnreadUpdates';
import { NewLabel } from '@/components/updates/NewLabel';

type CategoryMeta = {
  icon: LucideIcon;
  badgeClass: string;
};

const categoryMeta: Record<UpdateCategory, CategoryMeta> = {
  new: {
    icon: Sparkles,
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  fix: {
    icon: Bug,
    badgeClass:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  other: {
    icon: Settings2,
    badgeClass:
      'bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
  },
};

// YYYY-MM-DD を「2026年6月19日」に変換
function formatJaDate(date: string): string {
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return date;
  return `${y}年${Number(m)}月${Number(d)}日`;
}

type UpdateNotesListProps = {
  /** 表示する日付グループ数の上限（省略時は全件） */
  limit?: number;
  /** 新着の日付グループ見出しに New! を表示するか（既定: true） */
  highlightNew?: boolean;
};

export function UpdateNotesList({
  limit,
  highlightNew = true,
}: UpdateNotesListProps) {
  const { isNewGroup } = useUpdatesHighlight();
  const entries: UpdateEntry[] =
    typeof limit === 'number' ? updateNotes.slice(0, limit) : updateNotes;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        まだ更新情報はありません。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map((entry) => (
        <section key={entry.date}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            {formatJaDate(entry.date)}
            {highlightNew && isNewGroup(entry.date) && <NewLabel />}
          </h3>
          <ul className="space-y-3">
            {entry.items.map((item, index) => {
              const meta = categoryMeta[item.category];
              const Icon = meta.icon;
              return (
                <li
                  key={`${entry.date}-${index}`}
                  className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3"
                >
                  <span
                    className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                  >
                    <Icon className="size-3.5" />
                    {updateCategoryLabel[item.category]}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    {item.text}
                    {item.href && (
                      <Link
                        href={item.href}
                        className="ml-1 inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:no-underline"
                      >
                        {item.linkLabel ?? '詳細'}
                        <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
