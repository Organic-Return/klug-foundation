import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  // Protect the endpoint with a secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    // Revalidate the entire site layout (includes navigation)
    revalidatePath('/', 'layout');

    // Revalidate the homepage
    revalidatePath('/');

    // Revalidate all pages
    revalidatePath('/', 'page');

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error revalidating',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/', 'page');

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error revalidating',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
