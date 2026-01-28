import { NextRequest, NextResponse } from 'next/server';
import { getNeighborhoodsByCity, getDistinctNeighborhoods } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');

  try {
    let neighborhoods: string[];

    if (city) {
      neighborhoods = await getNeighborhoodsByCity(city);
    } else {
      neighborhoods = await getDistinctNeighborhoods();
    }

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return NextResponse.json({ neighborhoods: [] }, { status: 500 });
  }
}
