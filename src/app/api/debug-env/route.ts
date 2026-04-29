import { NextResponse } from 'next/server';
import { getGoogleMapsApiKey } from '@/lib/settings';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapsKeyEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsKeyResolved = await getGoogleMapsApiKey();

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET',
    supabaseKeySet: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET',
    googleMapsKeyEnv: mapsKeyEnv ? `${mapsKeyEnv.substring(0, 8)}...` : 'NOT SET (env)',
    googleMapsKeyResolved: mapsKeyResolved ? `${mapsKeyResolved.substring(0, 8)}...` : 'NOT SET (sanity+env)',
    nodeEnv: process.env.NODE_ENV,
  });
}
