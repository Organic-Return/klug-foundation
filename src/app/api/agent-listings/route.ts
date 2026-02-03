import { NextRequest, NextResponse } from 'next/server';
import { getListingsByAgentId } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status') || 'active';
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  try {
    const result = await getListingsByAgentId(agentId);
    const listings = status === 'sold'
      ? result.soldListings.slice(0, limit)
      : result.activeListings.slice(0, limit);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching agent listings:', error);
    return NextResponse.json({ listings: [], error: 'Failed to fetch listings' }, { status: 500 });
  }
}
