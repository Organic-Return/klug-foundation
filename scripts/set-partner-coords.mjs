import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Known city coordinates
const CITY_COORDS = {
  'santa barbara': { lat: 34.4208, lng: -119.6982 },
  'montecito': { lat: 34.4358, lng: -119.6318 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'vail': { lat: 39.6403, lng: -106.3742 },
  'rancho santa fe': { lat: 33.0164, lng: -117.2028 },
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'carmel': { lat: 36.5554, lng: -121.9233 },
  'pebble beach': { lat: 36.5725, lng: -121.9486 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'coral gables': { lat: 25.7215, lng: -80.2684 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'beverly hills': { lat: 34.0736, lng: -118.4004 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'telluride': { lat: 37.9375, lng: -107.8123 },
  'silicon valley': { lat: 37.3875, lng: -122.0575 },
  'menlo park': { lat: 37.4530, lng: -122.1817 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'cambridge': { lat: 42.3736, lng: -71.1097 },
  'aspen': { lat: 39.1911, lng: -106.8175 },
  'maui': { lat: 20.7984, lng: -156.3319 },
  'milwaukee': { lat: 43.0389, lng: -87.9065 },
  'greenwich': { lat: 41.0262, lng: -73.6282 },
  'nantucket': { lat: 41.2835, lng: -70.0995 },
  'atlanta': { lat: 33.7490, lng: -84.3880 },
  'east bay': { lat: 37.8716, lng: -122.2727 },
  'lafayette': { lat: 37.8858, lng: -122.1180 },
  'palm beach': { lat: 26.7056, lng: -80.0364 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'napa': { lat: 38.2975, lng: -122.2869 },
  'napa valley': { lat: 38.2975, lng: -122.2869 },
  'orange county': { lat: 33.7175, lng: -117.8311 },
  'newport beach': { lat: 33.6189, lng: -117.9290 },
  'palm springs': { lat: 33.8303, lng: -116.5453 },
  'sarasota': { lat: 27.3364, lng: -82.5307 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'naples': { lat: 26.1420, lng: -81.7948 },
  'marco island': { lat: 25.9412, lng: -81.7184 },
  'santa fe': { lat: 35.6870, lng: -105.9378 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'asheville': { lat: 35.5951, lng: -82.5515 },
  'park city': { lat: 40.6461, lng: -111.4980 },
  'salt lake city': { lat: 40.7608, lng: -111.8910 },
  'st. petersburg': { lat: 27.7676, lng: -82.6403 },
  'san juan islands': { lat: 48.5326, lng: -123.0286 },
  'united kingdom': { lat: 51.5074, lng: -0.1278 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'hillsborough': { lat: 37.5741, lng: -122.3794 },
  'burlingame': { lat: 37.5841, lng: -122.3661 },
};

function findCoords(location) {
  if (!location) return null;
  const loc = location.toLowerCase();

  // Try exact city matches
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(city)) return coords;
  }
  return null;
}

async function setPartnerCoords() {
  const partners = await client.fetch(
    `*[_type == "affiliatedPartner" && active == true && (!defined(latitude) || !defined(longitude))]{_id, firstName, lastName, location}`
  );

  console.log(`Found ${partners.length} partners without coordinates`);

  let updated = 0;
  let skipped = 0;

  for (const p of partners) {
    const coords = findCoords(p.location);
    if (!coords) {
      console.log(`  No coords for: ${p.firstName} ${p.lastName} - "${p.location}"`);
      skipped++;
      continue;
    }

    // Add small random offset to prevent markers from stacking
    const lat = coords.lat + (Math.random() - 0.5) * 0.02;
    const lng = coords.lng + (Math.random() - 0.5) * 0.02;

    await client.patch(p._id).set({ latitude: lat, longitude: lng }).commit();
    console.log(`  Set: ${p.firstName} ${p.lastName} -> ${lat.toFixed(4)}, ${lng.toFixed(4)} (${p.location})`);
    updated++;
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

setPartnerCoords().catch(console.error);
