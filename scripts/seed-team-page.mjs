import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Reuse the Why Klug Properties hero image — already published in
// the Sanity asset library.
const HERO_IMAGE_ASSET_REF = 'image-b5bacd8e09a1aa1adc3d9ecad0b1ae0f430714ab-3000x2000-jpg';

const result = await client.createOrReplace({
  _id: 'teamPage',
  _type: 'teamPage',
  heroTitle: 'Our Team',
  heroDescription:
    'Three full-time licensed real estate professionals born and raised in Colorado and the Roaring Fork Valley with over 25 years of combined real estate success and over $1 billion in career sales. We love this community and what we do, and we are passionate about sharing it and giving back through the Chris Klug Foundation and other local non-profits we support, such as the Aspen Center for Environmental Studies, Independence Pass Foundation, and Aspen Cycling Club.',
  heroImage: {
    _type: 'image',
    asset: { _type: 'reference', _ref: HERO_IMAGE_ASSET_REF },
  },
  stats: [
    { _key: 's1', value: '25+', label: 'Years Combined Experience' },
    { _key: 's2', value: '$1B+', label: 'In Career Sales' },
    { _key: 's3', value: '3', label: 'Licensed Brokers' },
  ],
  philosophyTitle: 'Rooted in This Community',
  philosophyContent:
    'We love this community and what we do, and we are passionate about sharing it and giving back. Our team supports the Chris Klug Foundation, the Aspen Center for Environmental Studies, the Independence Pass Foundation, and the Aspen Cycling Club — among other Roaring Fork Valley non-profits.',
  ctaTitle: 'Work With the Team',
  ctaDescription:
    'Whether you are buying or selling, the Klug Properties team is ready to help you make the most of the Roaring Fork Valley market.',
  ctaButtonLabel: 'Contact Us',
  ctaButtonHref: '/contact-us',
});

console.log('Seeded teamPage:', { _id: result._id, heroTitle: result.heroTitle });
