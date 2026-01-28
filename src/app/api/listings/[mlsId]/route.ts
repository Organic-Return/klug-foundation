import { NextRequest, NextResponse } from 'next/server';
import { getListingByMlsNumber, getListingById } from '@/lib/listings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  const { mlsId } = await params;

  if (!mlsId) {
    return NextResponse.json({ error: 'MLS ID is required' }, { status: 400 });
  }

  try {
    // Try to find by MLS number first
    let listing = await getListingByMlsNumber(mlsId);

    // If not found by MLS number, try by database ID
    if (!listing) {
      listing = await getListingById(mlsId);
    }

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}
