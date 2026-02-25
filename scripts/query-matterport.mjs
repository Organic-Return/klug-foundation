import { createClient } from '@supabase/supabase-js';

const url = process.env.REALOGY_SUPABASE_URL;
const key = process.env.REALOGY_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('REALOGY_SUPABASE_URL and REALOGY_SUPABASE_ANON_KEY env vars required');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('realogy_listings')
  .select('mls_numbers, street_address, city, state_province, media, is_active')
  .not('media', 'is', null);

if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

const results = [];
for (const row of data || []) {
  if (!row.media || !Array.isArray(row.media)) continue;
  const matterport = row.media.find(m => m?.format === '3D Video' && m?.url);
  if (matterport) {
    results.push({
      mls: (row.mls_numbers || []).join(', '),
      address: row.street_address || 'N/A',
      city: row.city || 'N/A',
      state: row.state_province || 'N/A',
      active: row.is_active,
      tourUrl: matterport.url,
    });
  }
}

console.log(`\nProperties with Matterport Virtual Tours: ${results.length}\n`);
for (const r of results) {
  console.log(`MLS: ${r.mls} | ${r.address}, ${r.city}, ${r.state}`);
  console.log(`  Tour URL: ${r.tourUrl}\n`);
}
