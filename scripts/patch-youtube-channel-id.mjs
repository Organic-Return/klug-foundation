import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const result = await client
  .patch('settings')
  .set({ 'apiKeys.youtubeChannelId': 'UCmH6J-E1hsz78_Q1IjaOoJg' })
  .commit();

console.log('Patched settings.apiKeys.youtubeChannelId:', result.apiKeys?.youtubeChannelId);
