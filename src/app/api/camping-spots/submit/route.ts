import { NextRequest, NextResponse } from 'next/server';
import { ensureDbConnection } from '@/lib/database';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import { CampingSpotSubmissionSchema } from '@/data/schemas/campingSpot';
import mailerSend from '@/lib/mailersend';
import { logger } from '@/lib/logger';
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

    // Check for duplicates:
    // 1. Same name (same prefecture) OR same URL → reject if within 200m, or if coords missing
    // 2. Different name/URL but very close (10m) → reject

    // Build OR conditions: always check name+prefecture, add URL check if provided
    const nameOrUrlConditions: Record<string, unknown>[] = [
      { name: validatedData.name, prefecture: validatedData.prefecture },
    ];
    if (validatedData.url) {
      nameOrUrlConditions.push({ url: validatedData.url });
    }

    const existingMatch = await CampingSpotSubmission.findOne({
      status: { $in: ['pending', 'approved'] },
      $or: nameOrUrlConditions,
    });

    if (existingMatch) {
      if (validatedData.coordinates && existingMatch.coordinates) {
        const distance = calculateDistance(
          validatedData.coordinates[1],
          validatedData.coordinates[0],
          existingMatch.coordinates[1],
          existingMatch.coordinates[0],
        );

        if (distance <= 200) {
          return NextResponse.json(
            {
              error:
                '同名またはURLが同じスポットが近くに既に投稿済みまたは承認済みです',
              details: `既存スポット: ${existingMatch.name} (${Math.round(distance)}m先)`,
            },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              '同名またはURLが同じスポットが既に投稿済みまたは承認済みです',
            details: `既存スポット: ${existingMatch.name} (${existingMatch.prefecture})`,
          },
          { status: 400 },
        );
      }
    }

    // Check for nearby spots that didn't match by name/URL (only if coordinates provided)
    if (validatedData.coordinates) {
      const nearbyExcludeConditions: Record<string, unknown>[] = [
        { name: validatedData.name },
      ];
      if (validatedData.url) {
        nearbyExcludeConditions.push({ url: validatedData.url });
      }

      const nearbySubmissions = await CampingSpotSubmission.find({
        coordinates: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: validatedData.coordinates,
            },
            $maxDistance: 10,
          },
        },
        $nor: nearbyExcludeConditions,
        status: { $in: ['pending', 'approved'] },
      }).limit(5);

      if (nearbySubmissions.length > 0) {
        const closestSubmission = nearbySubmissions[0];
        const distance = calculateDistance(
          validatedData.coordinates[1],
          validatedData.coordinates[0],
          closestSubmission.coordinates![1],
          closestSubmission.coordinates![0],
        );

        return NextResponse.json(
          {
            error: '非常に近い場所に別のスポットが既に投稿済みです',
            details: `既存スポット: ${closestSubmission.name} (${Math.round(distance)}m先)`,
          },
          { status: 400 },
        );
      }
    }

    // Create new submission
    const newSubmission = new CampingSpotSubmission(validatedData);
    await newSubmission.save();

    // Send email notification to admin
    if (process.env.ADMIN_EMAIL) {
      const result = await mailerSend.sendCampingSpotSubmission({
        name: validatedData.name,
        prefecture: validatedData.prefecture,
        address: validatedData.address,
        type: validatedData.type,
        submitterName: validatedData.submitterName,
        submitterEmail: validatedData.submitterEmail,
        adminEmail: process.env.ADMIN_EMAIL,
        submissionId: newSubmission._id.toString(),
      });

      if (!result.success) {
        logger.error(
          new Error(
            `[車中泊スポット投稿] 管理者通知メール送信失敗: ${result.error}`,
          ),
          {
            submissionId: newSubmission._id.toString(),
            isConfigError: result.isConfigError,
          },
        );
      }
    } else {
      logger.warn(
        '[車中泊スポット投稿] ADMIN_EMAILが未設定のため通知メールをスキップしました',
      );
    }

    return NextResponse.json(
      {
        message: '投稿が完了しました',
        id: newSubmission._id.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      // Validation error
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: '入力データが正しくありません',
            details: error.message,
          },
          { status: 400 },
        );
      }

      // MongoDB duplicate error
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            error: '同じ座標のスポットが既に投稿されています',
          },
          { status: 400 },
        );
      }
    }

    logger.error(
      error instanceof Error ? error : new Error('Submission error'),
    );
    return NextResponse.json(
      {
        error: '投稿処理でエラーが発生しました',
      },
      { status: 500 },
    );
  }
}
