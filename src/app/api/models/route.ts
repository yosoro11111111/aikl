import { NextResponse } from 'next/server';
import models from '@/data/models.json';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(models);
}
