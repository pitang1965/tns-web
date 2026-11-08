'use server';

import { revalidatePath } from 'next/cache';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { ensureDbConnection } from '@/lib/database';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import { isAdmin } from '@/lib/userUtils';

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await auth0.getSession();

  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  if (!isAdmin(session.user)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return session.user;
}

// Get all submissions with filters
export async function getCampingSpotSubmissions(
  status?: 'pending' | 'approved' | 'rejected',
) {
  await checkAdminAuth();
  await ensureDbConnection();

  const query: Record<string, unknown> = {};
  if (status) {
    query.status = status;
  }

  const submissions = await CampingSpotSubmission.find(query)
    .sort({ submittedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(submissions));
}

// Get submission by ID
export async function getCampingSpotSubmissionById(id: string) {
  await checkAdminAuth();
  await ensureDbConnection();

  const submission = await CampingSpotSubmission.findById(id).lean();
  if (!submission) {
    throw new Error('Submission not found');
  }

  return JSON.parse(JSON.stringify(submission));
}

// Reject submission
export async function rejectSubmission(id: string, reviewNotes: string) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const submission = await CampingSpotSubmission.findById(id);
  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== 'pending') {
    throw new Error('Submission is not pending');
  }

  submission.status = 'rejected';
  submission.reviewedAt = new Date();
  submission.reviewedBy = user.email;
  submission.reviewNotes = reviewNotes;
  await submission.save();

  revalidatePath('/admin/submissions');

  return { success: true };
}

// Delete submission
export async function deleteSubmission(id: string) {
  await checkAdminAuth();
  await ensureDbConnection();

  const deletedSubmission = await CampingSpotSubmission.findByIdAndDelete(id);
  if (!deletedSubmission) {
    throw new Error('Submission not found');
  }

  revalidatePath('/admin/submissions');

  return { success: true };
}

// Function to approve submission without creating camping spot (for edit workflow)
export async function approveSubmissionWithoutCreating(
  id: string,
  reviewNotes?: string,
) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const submission = await CampingSpotSubmission.findById(id);
  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== 'pending') {
    throw new Error('Submission is not pending');
  }

  // Update submission status only (camping spot already created separately)
  submission.status = 'approved';
  submission.reviewedAt = new Date();
  submission.reviewedBy = user.email;
  submission.reviewNotes = reviewNotes;
  await submission.save();

  revalidatePath('/admin/submissions');

  return { success: true };
}
