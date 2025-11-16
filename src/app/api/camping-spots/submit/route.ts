import { NextRequest, NextResponse } from 'next/server';
import { ensureDbConnection } from '@/lib/database';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import { CampingSpotSubmissionSchema } from '@/data/schemas/campingSpot';
import mailerSend from '@/lib/mailersend';
import { calculateDistance } from '@/lib/utils/distance';


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

    // Check for duplicates with improved logic:
    // 1. If name matches exactly:
    //    - Both have coordinates: reject if within 100m
    //    - Either lacks coordinates: reject only if same prefecture
    // 2. If name differs and coordinates exist: reject only if within 10m

    // First, check for exact name match in same prefecture
    const exactNameMatch = await CampingSpotSubmission.findOne({
      name: validatedData.name,
      prefecture: validatedData.prefecture,
      status: { $in: ['pending', 'approved'] },
    });

    if (exactNameMatch) {
      // If exact name match found in same prefecture
      if (validatedData.coordinates && exactNameMatch.coordinates) {
        // Both have coordinates: check distance
        const distance = calculateDistance(
          validatedData.coordinates[1],
          validatedData.coordinates[0],
          exactNameMatch.coordinates[1],
          exactNameMatch.coordinates[0]
        );

        // Reject if within 100m
        if (distance <= 100) {
          return NextResponse.json(
            {
              error: '同名のスポットが近くに既に投稿済みまたは承認済みです',
              details: `既存スポット: ${exactNameMatch.name} (${Math.round(distance)}m先)`,
            },
            { status: 400 }
          );
        }
      } else {
        // Either submission lacks coordinates: reject based on name and prefecture match
        return NextResponse.json(
          {
            error: '同名のスポットが同じ都道府県に既に投稿済みまたは承認済みです',
            details: `既存スポット: ${exactNameMatch.name} (${exactNameMatch.prefecture})`,
          },
          { status: 400 }
        );
      }
    }

    // Second, check for nearby spots with different names (only if coordinates provided)
    if (validatedData.coordinates) {
      const nearbySubmissions = await CampingSpotSubmission.find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: validatedData.coordinates,
            },
            $maxDistance: 10, // Only check very close spots (10m)
          },
        },
        name: { $ne: validatedData.name }, // Exclude same name (already checked above)
        status: { $in: ['pending', 'approved'] },
      }).limit(5);

      if (nearbySubmissions.length > 0) {
        const closestSubmission = nearbySubmissions[0];
        const distance = calculateDistance(
          validatedData.coordinates[1],
          validatedData.coordinates[0],
          closestSubmission.coordinates![1],
          closestSubmission.coordinates![0]
        );

        return NextResponse.json(
          {
            error: '非常に近い場所に別のスポットが既に投稿済みです',
            details: `既存スポット: ${closestSubmission.name} (${Math.round(distance)}m先)`,
          },
          { status: 400 }
        );
      }
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
