import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ALLOWED_CITIES = [
  'Aspen', 'Snowmass Village', 'Woody Creek', 'Snowmass',
  'Basalt', 'El Jebel', 'Carbondale', 'Glenwood Springs', 'Marble',
];

// Try the RPC first (fast, distinct values)
let cities = [];
const { data: rpc } = await supabase.rpc('get_distinct_cities');
if (rpc && Array.isArray(rpc)) {
  cities = rpc.map((d) => d.city).filter(Boolean);
}

// Fallback / supplementary: paginate the materialized view
if (cities.length === 0) {
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase
      .from('graphql_listings')
      .select('city')
      .not('city', 'is', null)
      .order('city')
      .range(i * 1000, i * 1000 + 999);
    for (const r of data || []) seen.add(r.city);
  }
  cities = Array.from(seen);
}

cities.sort((a, b) => a.localeCompare(b));

const allowed = new Set(ALLOWED_CITIES.map((c) => c.toLowerCase()));
const allowedFound = [];
const blockedFound = [];
for (const c of cities) {
  if (allowed.has(c.toLowerCase())) allowedFound.push(c);
  else blockedFound.push(c);
}

console.log('Distinct cities in the MLS feed:', cities.length);
console.log('');
console.log('On the site (allowed):', allowedFound.length);
allowedFound.forEach((c) => console.log('  ✓', c));
console.log('');
console.log('Blocked by allowedCities filter:', blockedFound.length);
blockedFound.forEach((c) => console.log('  ✗', c));

// Also count active listings per blocked city to understand the scale of inventory missed
console.log('');
console.log('Active inventory per blocked city (top 25 by count):');
const counts = [];
for (const c of blockedFound) {
  const { count } = await supabase
    .from('graphql_listings')
    .select('*', { count: 'exact', head: true })
    .ilike('city', c)
    .not('status', 'in', '(Closed,Sold,Withdrawn,Expired)');
  if (count != null) counts.push({ c, count });
}
counts.sort((a, b) => b.count - a.count);
for (const { c, count } of counts.slice(0, 25)) {
  console.log(`  ${String(count).padStart(5)}  ${c}`);
}
const totalBlocked = counts.reduce((s, { count }) => s + count, 0);
console.log('');
console.log(`Total active listings in blocked cities: ${totalBlocked}`);
