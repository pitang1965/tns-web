'use server';

import { revalidatePath } from 'next/cache';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import CampingSpot from '@/lib/models/CampingSpot';

// Helper function to check admin authorization
async function checkAdminAuth() {
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

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI!;
    // Database name is determined by MONGODB_URI
    await mongoose.connect(uri);
  }
}

// Get all submissions with filters
export async function getCampingSpotSubmissions(
  status?: 'pending' | 'approved' | 'rejected'
) {
  await checkAdminAuth();
  await ensureDbConnection();

  const query: any = {};
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

// Approve submission and convert to camping spot
export async function approveSubmission(id: string, reviewNotes?: string) {
  const user = await checkAdminAuth();
  await ensureDbConnection();

  const submission = await CampingSpotSubmission.findById(id);
  if (!submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== 'pending') {
    throw new Error('Submission is not pending');
  }

  // Check for duplicates in main collection (within 100m)
  const existingSpot = await CampingSpot.findOne({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: submission.coordinates,
        },
        $maxDistance: 100,
      },
    },
  });

  if (existingSpot) {
    throw new Error(`100m以内に既存スポットがあります: ${existingSpot.name}`);
  }

  // Convert submission to camping spot format
  const campingSpotData = {
    name: submission.name,
    coordinates: submission.coordinates,
    prefecture: submission.prefecture,
    address: submission.address,
    type: submission.type,
    hasRoof: submission.hasRoof,
    hasPowerOutlet: submission.hasPowerOutlet,
    pricing: {
      isFree: submission.isFree,
      pricePerNight: submission.pricePerNight,
      priceNote: submission.priceNote,
    },
    notes: submission.notes,
    submittedBy:
      submission.submitterEmail || submission.submitterName || 'Anonymous',
    isVerified: true,
    // Default values for missing fields
    distanceToToilet: 0,
    quietnessLevel: 3,
    securityLevel: 3,
    overallRating: 3,
    capacity: 1,
    restrictions: [],
    amenities: [],
    security: {
      hasGate: false,
      hasLighting: false,
      hasStaff: false,
    },
    nightNoise: {
      hasNoiseIssues: false,
      nearBusyRoad: false,
      isQuietArea: false,
    },
  };

  // Create new camping spot
  const newSpot = new CampingSpot(campingSpotData);
  await newSpot.save();

  // Update submission status
  submission.status = 'approved';
  submission.reviewedAt = new Date();
  submission.reviewedBy = user.email;
  submission.reviewNotes = reviewNotes;
  await submission.save();

  revalidatePath('/admin/shachu-haku');
  revalidatePath('/shachu-haku');
  revalidatePath('/admin/submissions');

  return { success: true, spotId: newSpot._id.toString() };
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
  reviewNotes?: string
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
