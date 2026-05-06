import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const result = await client
  .patch('homepage')
  .set({
    'teamSection.secondaryButtonText': 'LEARN MORE',
    'teamSection.secondaryButtonLink': '/about/our-team',
  })
  .commit();

console.log('Patched homepage teamSection:', {
  secondaryButtonText: result.teamSection?.secondaryButtonText,
  secondaryButtonLink: result.teamSection?.secondaryButtonLink,
});
