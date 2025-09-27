import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import { CampingSpotSubmissionSchema } from '@/data/schemas/campingSpot';
import mailerSend from '@/lib/mailersend';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI!;
    const dbName = 'itinerary_db';
    await mongoose.connect(uri, { dbName });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbConnection();

    const body = await request.json();

    // Validate the submission data
    const validatedData = CampingSpotSubmissionSchema.parse({
      ...body,
      submittedAt: new Date(),
      status: 'pending',
    });

    // Check for duplicates within 100m
    const existingSubmission = await CampingSpotSubmission.findOne({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: validatedData.coordinates,
          },
          $maxDistance: 100,
        },
      },
      status: { $in: ['pending', 'approved'] },
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: '100m以内に既に投稿済みまたは承認済みのスポットがあります',
          details: `既存スポット: ${existingSubmission.name}`,
        },
        { status: 400 }
      );
    }

    // Create new submission
    const newSubmission = new CampingSpotSubmission(validatedData);
    await newSubmission.save();

    // Send email notification to admin
    if (process.env.MAILERSEND_API_TOKEN && process.env.ADMIN_EMAIL) {
      try {
        await mailerSend.sendCampingSpotSubmission({
          name: validatedData.name,
          prefecture: validatedData.prefecture,
          address: validatedData.address,
          type: validatedData.type,
          submitterName: validatedData.submitterName,
          submitterEmail: validatedData.submitterEmail,
          adminEmail: process.env.ADMIN_EMAIL,
          submissionId: newSubmission._id.toString(),
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json(
      {
        message: '投稿が完了しました',
        id: newSubmission._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submission error:', error);

    if (error instanceof Error) {
      // Validation error
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: '入力データが正しくありません',
            details: error.message,
          },
          { status: 400 }
        );
      }

      // MongoDB duplicate error
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            error: '同じ座標のスポットが既に投稿されています',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: '投稿処理でエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
