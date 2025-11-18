'use server';

import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

// Helper function to check admin authorization
export async function checkAdminAuth() {
  const session = await auth0.getSession();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()) || [];
  if (!adminEmails.includes(session.user.email)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return session.user;
}
