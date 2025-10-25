import { Suspense } from 'react';
import AdminClient from './AdminClient';
import { LoadingState } from '@/components/common/LoadingState';

export default function ShachuHakuAdminPage() {
  return (
    <Suspense fallback={<LoadingState variant='fullscreen' />}>
      <AdminClient />
    </Suspense>
  );
}
