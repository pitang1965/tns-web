import { Suspense } from 'react';
import EditClient from './EditClient';
import { LoadingState } from '@/components/common/LoadingState';

export default function ShachuHakuEditPage() {
  return (
    <Suspense fallback={<LoadingState variant='fullscreen' />}>
      <EditClient />
    </Suspense>
  );
}
