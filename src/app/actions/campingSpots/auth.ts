'use server';

import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/userUtils';

// Helper function to check admin authorization
export async function checkAdminAuth() {
  const session = await auth0.getSession();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  if (!isAdmin(session.user)) {
    throw new Error('Unauthorized: Admin access required');
  }

  // email を string として返す（呼び出し側が操作者として記録するため）
  return { ...session.user, email: session.user.email };
}
