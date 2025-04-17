'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { DayPlan } from '@/data/schemas/itinerarySchema';

interface DayPaginationProps {
  dayPlans?: DayPlan[];
  totalDays?: number;
  currentDayPlan?: DayPlan | null;
  renderDayPlan: (dayPlan: DayPlan, index: number) => React.ReactNode;
  onDayChange?: (day: number) => void;
  initialSelectedDay?: number;
}
export const DayPagination: React.FC<DayPaginationProps> = ({
  dayPlans,
  totalDays,
  currentDayPlan,
  renderDayPlan,
  onDayChange,
  initialSelectedDay = 1,
}) => {
  // 直前のページ操作を追跡するref
  const isUserNavigation = useRef(false);

  // 実際の日数を計算（dayPlansの長さまたはtotalDaysから）
  const actualTotalDays = dayPlans?.length || totalDays || 1;

  // 初期選択日が有効な範囲内になるように調整
  const validInitialDay = Math.min(
    Math.max(initialSelectedDay, 1),
    actualTotalDays
  );

  const [currentPage, setCurrentPage] = useState(validInitialDay);

  // デバッグ用
  const prevInitialSelectedDayRef = useRef(initialSelectedDay);

  // initialSelectedDayが変更されたときにcurrentPageを更新
  // ただし、ユーザーがページを変更した場合は反映しない
  useEffect(() => {
    // ユーザーによるナビゲーションの場合は処理をスキップ
    if (isUserNavigation.current) {
      isUserNavigation.current = false;
      return;
    }

    // 前回のinitialSelectedDayと現在の値が異なる場合のみ処理（親コンポーネントからの変更）
    if (initialSelectedDay !== prevInitialSelectedDayRef.current) {
      prevInitialSelectedDayRef.current = initialSelectedDay;

      if (initialSelectedDay) {
        const validDay = Math.min(
          Math.max(initialSelectedDay, 1),
          actualTotalDays
        );
        setCurrentPage(validDay);
      }
    }
  }, [initialSelectedDay, actualTotalDays]);

  // コンポーネントがマウントされた時に初期ページを親に通知
  useEffect(() => {
    if (onDayChange && initialSelectedDay !== currentPage) {
      onDayChange(currentPage);
    }
  }, []);

  // ページを変更する関数
  const goToPage = (page: number) => {
    console.log('ページに移動:', page, '合計ページ数:', actualTotalDays);

    // ユーザーのナビゲーションであることをマーク
    isUserNavigation.current = true;

    // 妥当性チェック（範囲を確認）
    if (page < 1 || page > actualTotalDays) {
      console.error('無効なページ番号:', page);
      return;
    }

    setCurrentPage(page);

    // 親コンポーネントに現在のページを通知
    if (onDayChange) {
      onDayChange(page);
    }
  };

  // 前のページに移動
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // 次のページに移動
  const goToNextPage = () => {
    if (currentPage < actualTotalDays) {
      goToPage(currentPage + 1);
    }
  };

  // 表示するページ数の計算
  const maxVisiblePages = 5; // 表示するページリンクの最大数

  // ページネーションリンクの生成
  const generatePaginationLinks = () => {
    // ページ数が少ない場合はすべて表示
    if (actualTotalDays <= maxVisiblePages) {
      return Array.from({ length: actualTotalDays }, (_, i) => i + 1).map(
        (page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault(); // デフォルトのリンク動作を防止
                goToPage(page);
              }}
              isActive={page === currentPage}
            >
              {page}日目
            </PaginationLink>
          </PaginationItem>
        )
      );
    }

    // ページ数が多い場合は省略表示
    const items = [];

    // 常に最初のページを表示
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={(e) => {
            e.preventDefault();
            goToPage(1);
          }}
          isActive={1 === currentPage}
        >
          1日目
        </PaginationLink>
      </PaginationItem>
    );

    // 現在のページが前方に寄っている場合
    if (currentPage < 4) {
      for (let i = 2; i <= 4; i++) {
        if (i <= actualTotalDays) {
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(i);
                }}
                isActive={i === currentPage}
              >
                {i}日目
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (actualTotalDays > 4) {
        items.push(
          <PaginationItem key='ellipsis1'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    // 現在のページが後方に寄っている場合
    else if (currentPage > actualTotalDays - 3) {
      items.push(
        <PaginationItem key='ellipsis1'>
          <PaginationEllipsis />
        </PaginationItem>
      );
      for (let i = actualTotalDays - 3; i < actualTotalDays; i++) {
        if (i > 1) {
          // 最初のページと重複しないように
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(i);
                }}
                isActive={i === currentPage}
              >
                {i}日目
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
    }
    // 中間にある場合
    else {
      items.push(
        <PaginationItem key='ellipsis1'>
          <PaginationEllipsis />
        </PaginationItem>
      );
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        if (i > 1 && i < actualTotalDays) {
          // 最初と最後のページと重複しないように
          items.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(i);
                }}
                isActive={i === currentPage}
              >
                {i}日目
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      items.push(
        <PaginationItem key='ellipsis2'>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // 常に最後のページを表示
    if (actualTotalDays > 1) {
      items.push(
        <PaginationItem key={actualTotalDays}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              console.log('最終日クリック:', actualTotalDays);
              goToPage(actualTotalDays);
            }}
            isActive={actualTotalDays === currentPage}
          >
            {actualTotalDays}日目
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // デバッグ用のログ
  useEffect(() => {
    console.log('DayPagination render:', {
      dayPlans,
      currentPage,
      actualTotalDays,
    });
  }, [dayPlans, currentPage, actualTotalDays]);

  return (
    <>
      {dayPlans &&
      dayPlans.length > 0 &&
      currentPage > 0 &&
      currentPage <= dayPlans.length
        ? renderDayPlan(dayPlans[currentPage - 1], currentPage - 1)
        : currentDayPlan && renderDayPlan(currentDayPlan, currentPage - 1)}

      {actualTotalDays > 1 && (
        <div className='mt-6'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => {
                    e.preventDefault();
                    goToPreviousPage();
                  }}
                  className={
                    currentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>

              {generatePaginationLinks()}

              <PaginationItem>
                <PaginationNext
                  onClick={(e) => {
                    e.preventDefault();
                    goToNextPage();
                  }}
                  className={
                    currentPage === actualTotalDays
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};
