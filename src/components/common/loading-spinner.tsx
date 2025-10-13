import { Spinner } from '@/components/ui/spinner';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-12 text-white" />
        <p className="text-white text-sm">読み込み中...</p>
      </div>
    </div>
  );
}
