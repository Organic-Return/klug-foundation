import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch distinct mls_area_minor values (neighborhoods)
    const { data: neighborhoodData, error: neighborhoodError } = await supabase
      .from('graphql_listings')
      .select('mls_area_minor')
      .not('mls_area_minor', 'is', null)
      .not('mls_area_minor', 'eq', '');

    if (neighborhoodError) {
      console.error('Error fetching neighborhoods:', neighborhoodError);
      throw new Error('Failed to fetch neighborhoods');
    }

    // Fetch distinct subdivision_name values (complexes)
    const { data: complexData, error: complexError } = await supabase
      .from('graphql_listings')
      .select('subdivision_name')
      .not('subdivision_name', 'is', null)
      .not('subdivision_name', 'eq', '');

    if (complexError) {
      console.error('Error fetching complexes:', complexError);
      throw new Error('Failed to fetch complexes');
    }

    // Get unique values and sort alphabetically
    const neighborhoods = [...new Set(neighborhoodData?.map(item => item.mls_area_minor) || [])]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const complexes = [...new Set(complexData?.map(item => item.subdivision_name) || [])]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      neighborhoods,
      complexes,
    });
  } catch (error) {
    console.error('Error in listing-options API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
