import { Suspense } from 'react';
import ShachuHakuEditor from './ShachuHakuEditor';
import { LoadingState } from '@/components/common/LoadingState';

export default function ShachuHakuEditPage() {
  return (
    <Suspense fallback={<LoadingState variant='fullscreen' />}>
      <ShachuHakuEditor />
    </Suspense>
  );
}
