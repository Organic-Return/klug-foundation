import { NextResponse } from 'next/server';
import { getGoogleMapsApiKey, getCensusApiKey } from '@/lib/settings';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const mapsKeyEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsKeyResolved = await getGoogleMapsApiKey();
  const censusKeyEnv = process.env.CENSUS_API_KEY;
  const censusKeyResolved = await getCensusApiKey();
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sanityToken = process.env.SANITY_API_TOKEN;

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET',
    supabaseKeySet: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET',
    supabaseServiceRoleSet: supabaseServiceRole ? 'SET' : 'NOT SET',
    googleMapsKeyEnv: mapsKeyEnv ? `${mapsKeyEnv.substring(0, 8)}...` : 'NOT SET (env)',
    googleMapsKeyResolved: mapsKeyResolved ? `${mapsKeyResolved.substring(0, 8)}...` : 'NOT SET (sanity+env)',
    censusKeyEnv: censusKeyEnv ? `${censusKeyEnv.substring(0, 6)}...` : 'NOT SET (env)',
    censusKeyResolved: censusKeyResolved ? `${censusKeyResolved.substring(0, 6)}...` : 'NOT SET (sanity+env)',
    sendgridApiKeySet: sendgridApiKey ? 'SET' : 'NOT SET',
    sendgridFromEmail: sendgridFromEmail || 'NOT SET',
    sanityTokenSet: sanityToken ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });
}
