'use client';

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

type DayPaginationProps = {
  dayPlans?: DayPlan[];
  totalDays?: number;
  currentDayPlan?: DayPlan | null;
  renderDayPlan: (dayPlan: DayPlan, index: number) => React.ReactNode;
  onDayChange?: (day: number) => void;
  currentPage: number;
}
export const DayPagination: React.FC<DayPaginationProps> = ({
  dayPlans,
  totalDays,
  currentDayPlan,
  renderDayPlan,
  onDayChange,
  currentPage,
}) => {
  // 実際の日数を計算（dayPlansの長さまたはtotalDaysから）
  const actualTotalDays = dayPlans?.length || totalDays || 1;

  // ページを変更する関数
  const goToPage = (page: number) => {
    if (page < 1 || page > actualTotalDays) return;
    onDayChange?.(page);
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
                e.preventDefault();
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
