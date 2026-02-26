import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    today: new Date().toISOString().split('T')[0],
    supabaseConfigured: isSupabaseConfigured(),
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ...results, error: 'Supabase not configured' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Step 1: open_houses table
  try {
    const { data: ohData, error: ohError, count } = await supabase
      .from('open_houses')
      .select('"ListingId", "OpenHouseDate"', { count: 'exact' })
      .gte('OpenHouseDate', today)
      .order('OpenHouseDate', { ascending: true })
      .limit(5);

    results.step1 = {
      error: ohError?.message || null,
      count,
      sampleCount: ohData?.length || 0,
      sample: ohData?.slice(0, 3) || [],
    };
  } catch (e: any) {
    results.step1 = { error: e.message };
  }

  // Step 2: active_listings table
  try {
    const { count, error } = await supabase
      .from('active_listings')
      .select('*', { count: 'exact', head: true });

    results.step2_active_listings = {
      error: error?.message || null,
      totalRows: count,
    };
  } catch (e: any) {
    results.step2_active_listings = { error: e.message };
  }

  // Step 3: Test full flow with one listing ID
  if (results.step1?.sample?.length > 0) {
    const testId = results.step1.sample[0].ListingId;
    try {
      const { data, error } = await supabase
        .from('active_listings')
        .select('listing_id, address, city, status')
        .eq('listing_id', testId)
        .limit(1);

      results.step3_lookup = {
        testListingId: testId,
        error: error?.message || null,
        found: data?.length || 0,
        data: data?.[0] || null,
      };
    } catch (e: any) {
      results.step3_lookup = { error: e.message };
    }
  }

  return NextResponse.json(results);
}
