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
  dayPlans: DayPlan[];
  renderDayPlan: (dayPlan: DayPlan, index: number) => React.ReactNode;
  onDayChange?: (day: number) => void; // 日付変更時、URLを更新するためのコールバック
  initialSelectedDay?: number; // URLから初期表示する日付
}

export const DayPagination: React.FC<DayPaginationProps> = ({
  dayPlans,
  renderDayPlan,
  onDayChange,
  initialSelectedDay = 1,
}) => {
  // 直前のページ操作を追跡するref
  const isUserNavigation = useRef(false);

  // 初期選択日が有効な範囲内になるように調整
  const validInitialDay = Math.min(
    Math.max(initialSelectedDay, 1),
    dayPlans?.length || 1
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
          dayPlans?.length || 1
        );
        setCurrentPage(validDay);
      }
    }
  }, [initialSelectedDay, dayPlans?.length]);

  // コンポーネントがマウントされた時に初期ページを親に通知
  useEffect(() => {
    if (onDayChange && initialSelectedDay !== currentPage) {
      onDayChange(currentPage);
    }
  }, []);

  // ページを変更する関数
  const goToPage = (page: number) => {
    console.log('ページに移動:', page, '合計ページ数:', dayPlans?.length);

    // ユーザーのナビゲーションであることをマーク
    isUserNavigation.current = true;

    // 妥当性チェック（範囲を確認）
    if (page < 1 || page > (dayPlans?.length || 1)) {
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
    const totalPages = dayPlans?.length || 0;
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // 表示するページ数の計算
  const totalPages = dayPlans?.length || 0;
  const maxVisiblePages = 5; // 表示するページリンクの最大数

  // 現在のページの旅程を取得
  const currentDayPlan =
    dayPlans && dayPlans.length > 0 ? dayPlans[currentPage - 1] : null;

  // ページネーションリンクの生成
  const generatePaginationLinks = () => {
    // ページ数が少ない場合はすべて表示
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
      ));
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
        if (i <= totalPages) {
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
      if (totalPages > 4) {
        items.push(
          <PaginationItem key='ellipsis1'>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    // 現在のページが後方に寄っている場合
    else if (currentPage > totalPages - 3) {
      items.push(
        <PaginationItem key='ellipsis1'>
          <PaginationEllipsis />
        </PaginationItem>
      );
      for (let i = totalPages - 3; i < totalPages; i++) {
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
        if (i > 1 && i < totalPages) {
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
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              console.log('最終日クリック:', totalPages);
              goToPage(totalPages);
            }}
            isActive={totalPages === currentPage}
          >
            {totalPages}日目
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <>
      {currentDayPlan && renderDayPlan(currentDayPlan, currentPage - 1)}

      {totalPages > 1 && (
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
                    currentPage === totalPages
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
