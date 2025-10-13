import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <FileQuestion className='h-16 w-16' />
          </EmptyMedia>
          <EmptyTitle>404 - ページが見つかりません</EmptyTitle>
          <EmptyDescription>
            お探しのページは存在しないか、移動した可能性があります。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href='/'>ホームに戻る</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
