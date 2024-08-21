// src/app/api/itineraries/new/route.ts

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const { title, description } = await request.json();
  const id = uuidv4();

  //　TODO: ここでデータベースに保存する処理を実装
  // 例: await db.itineraries.create({ id, title, description });

  return NextResponse.json({ id, title, description });
}
