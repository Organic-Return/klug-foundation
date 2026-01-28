import { NextRequest, NextResponse } from 'next/server';
import { getNewestHighPricedByCity, getNewestHighPricedByCities } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const citiesParam = searchParams.get('cities');
  const city = searchParams.get('city');
  const limit = parseInt(searchParams.get('limit') || '8', 10);

  try {
    let properties;

    if (citiesParam) {
      // Multiple cities passed as comma-separated string
      const cities = citiesParam.split(',').map(c => c.trim()).filter(Boolean);
      properties = await getNewestHighPricedByCities(cities, limit);
    } else if (city) {
      // Single city (backwards compatible)
      properties = await getNewestHighPricedByCity(city, limit);
    } else {
      // Default to Aspen
      properties = await getNewestHighPricedByCity('Aspen', limit);
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return NextResponse.json({ properties: [], error: 'Failed to fetch properties' }, { status: 500 });
  }
}
