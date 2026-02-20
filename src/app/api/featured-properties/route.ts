import { NextRequest, NextResponse } from 'next/server';
import { getNewestHighPricedByCity, getNewestHighPricedByCities, getNewestHighPriced } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const citiesParam = searchParams.get('cities');
  const city = searchParams.get('city');
  const limit = parseInt(searchParams.get('limit') || '8', 10);
  const officeName = searchParams.get('officeName') || undefined;
  const agentIdsParam = searchParams.get('agentIds');
  const agentIds = agentIdsParam
    ? agentIdsParam.split(',').map(id => id.trim()).filter(Boolean)
    : undefined;

  const minPriceParam = searchParams.get('minPrice');
  const minPrice = minPriceParam ? parseInt(minPriceParam, 10) : undefined;
  const sortBy = searchParams.get('sortBy') === 'price' ? 'price' as const : undefined;
  const excludeLand = searchParams.get('excludeLand') === 'true' ? true : undefined;

  const filterOptions: { officeName?: string; agentIds?: string[]; minPrice?: number; sortBy?: 'date' | 'price'; excludeLand?: boolean } | undefined =
    officeName ? { officeName, minPrice, sortBy, excludeLand } : agentIds ? { agentIds, minPrice, sortBy, excludeLand } : (minPrice || sortBy || excludeLand) ? { minPrice, sortBy, excludeLand } : undefined;

  try {
    let properties;

    if (citiesParam) {
      const cities = citiesParam.split(',').map(c => c.trim()).filter(Boolean);
      properties = await getNewestHighPricedByCities(cities, limit, filterOptions);
    } else if (city) {
      properties = await getNewestHighPricedByCity(city, limit, filterOptions);
    } else {
      // No city specified — fetch from all properties in the database
      properties = await getNewestHighPriced(limit, filterOptions);
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return NextResponse.json({ properties: [], error: 'Failed to fetch properties' }, { status: 500 });
  }
}
