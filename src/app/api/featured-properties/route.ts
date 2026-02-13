import { NextRequest, NextResponse } from 'next/server';
import { getNewestHighPricedByCity, getNewestHighPricedByCities } from '@/lib/listings';

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

  const filterOptions = officeName ? { officeName } : agentIds ? { agentIds } : undefined;

  try {
    let properties;

    if (citiesParam) {
      const cities = citiesParam.split(',').map(c => c.trim()).filter(Boolean);
      properties = await getNewestHighPricedByCities(cities, limit, filterOptions);
    } else if (city) {
      properties = await getNewestHighPricedByCity(city, limit, filterOptions);
    } else {
      properties = await getNewestHighPricedByCity('Aspen', limit, filterOptions);
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    return NextResponse.json({ properties: [], error: 'Failed to fetch properties' }, { status: 500 });
  }
}
