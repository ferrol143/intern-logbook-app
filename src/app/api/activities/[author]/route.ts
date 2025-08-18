import { PaginatedResponse } from '@/app/types/api';
import { prisma } from '../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { author: string } }
) {
  try {
    const author = await context.params.author;

    // Parse query params for pagination
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Count total activities for this author
    const total = await prisma.activity.count({
      where: { author },
    });

    if (total === 0) {
      return NextResponse.json(
        { success: false, error: 'Activity not found', pagination: null },
        { status: 404 }
      );
    }

    // Fetch paginated activities
    const activities = await prisma.activity.findMany({
      where: { author },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // optional: sort by date descending
    });

    const pages = Math.ceil(total / limit);

    const response: PaginatedResponse<typeof activities[0]> = {
      success: true,
      data: activities,
      message: 'Activity retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', pagination: null },
      { status: 500 }
    );
  }
}