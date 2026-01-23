import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import {
  generateCalendarSVG,
  CalendarType,
  LifeCalendarConfig,
  YearCalendarConfig,
  GoalCalendarConfig,
  CalendarConfig,
} from '@/src/Components/LifeCalender/utils/svgGenerator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse common parameters
    const type = (searchParams.get('type') || 'life') as CalendarType;
    const birthDate =
      searchParams.get('birthDate') ||
      new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const currentDate = searchParams.get('currentDate') || new Date().toISOString().split('T')[0];
    const boxSize = parseInt(searchParams.get('boxSize') || '10');
    const boxSpacing = parseInt(searchParams.get('boxSpacing') || '4');
    const livedColor = searchParams.get('livedColor') || '#6366f1';
    const remainingColor = searchParams.get('remainingColor') || '#fbbf24';
    const futureColor = searchParams.get('futureColor') || '#e5e7eb';
    const backgroundColor = searchParams.get('backgroundColor') || '#ffffff';
    const titleColor = searchParams.get('titleColor') || '#222222';
    const textColor = searchParams.get('textColor') || '#999999';

    let config: CalendarConfig;

    // Build config based on type
    if (type === 'year') {
      const targetDate = searchParams.get('targetDate') || currentDate;
      config = {
        type: 'year',
        birthDate,
        currentDate,
        targetDate,
        boxSize,
        boxSpacing,
        livedColor,
        remainingColor,
        futureColor,
        backgroundColor,
      } as YearCalendarConfig;
    } else if (type === 'goal') {
      const goalDate =
        searchParams.get('goalDate') ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
      config = {
        type: 'goal',
        birthDate,
        currentDate,
        goalDate,
        boxSize,
        boxSpacing,
        livedColor,
        remainingColor,
        futureColor,
        backgroundColor,
      } as GoalCalendarConfig;
    } else {
      config = {
        type: 'life',
        birthDate,
        currentDate,
        boxSize,
        boxSpacing,
        livedColor,
        remainingColor,
        futureColor,
        backgroundColor,
      } as LifeCalendarConfig;
    }

    // Generate SVG using utility
    const svg = generateCalendarSVG(config);

    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    // Return PNG image
    // @ts-expect-error
    return new NextResponse(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar image' },
      { status: 500 }
    );
  }
}
