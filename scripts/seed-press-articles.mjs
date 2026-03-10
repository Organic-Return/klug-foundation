import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const pressArticles = [
  {
    _type: 'pressArticle',
    _id: 'press-robb-report-aspen-luxury',
    title: 'The New Era of Aspen Luxury: How Mountain Living Is Being Redefined',
    sourceName: 'Robb Report',
    url: 'https://robbreport.com',
    excerpt: 'A deep dive into how Aspen\'s luxury real estate market is evolving, with a focus on sustainability, modern design, and the growing demand for mountain retreats among ultra-high-net-worth buyers.',
    publishedAt: '2026-01-15',
    featured: true,
  },
  {
    _type: 'pressArticle',
    _id: 'press-wsj-mountain-markets',
    title: 'Mountain Resort Markets Continue to Outperform Urban Luxury Segments',
    sourceName: 'Wall Street Journal',
    url: 'https://wsj.com',
    excerpt: 'Aspen and Snowmass Village lead the charge as mountain resort communities see record-breaking sales volumes, driven by remote work flexibility and lifestyle-focused buyers.',
    publishedAt: '2025-12-08',
    featured: false,
  },
  {
    _type: 'pressArticle',
    _id: 'press-forbes-roaring-fork',
    title: 'Why the Roaring Fork Valley Is the Most Coveted Address in American Real Estate',
    sourceName: 'Forbes',
    url: 'https://forbes.com',
    excerpt: 'From Aspen to Carbondale, the Roaring Fork Valley offers an unmatched combination of natural beauty, cultural richness, and investment potential.',
    publishedAt: '2025-11-20',
    featured: false,
  },
  {
    _type: 'pressArticle',
    _id: 'press-architectural-digest-design',
    title: 'Inside the Most Stunning New Builds in Aspen\'s Red Mountain Enclave',
    sourceName: 'Architectural Digest',
    url: 'https://architecturaldigest.com',
    excerpt: 'Award-winning architects are reimagining mountain architecture with floor-to-ceiling glass, living roofs, and seamless indoor-outdoor living spaces.',
    publishedAt: '2025-10-05',
    featured: false,
  },
  {
    _type: 'pressArticle',
    _id: 'press-bloomberg-investment',
    title: 'Aspen Real Estate: A Safe Haven for Wealth Preservation in Uncertain Times',
    sourceName: 'Bloomberg',
    url: 'https://bloomberg.com',
    excerpt: 'Luxury real estate in resort communities like Aspen continues to demonstrate resilience, with properties holding value and appreciating even amid broader economic headwinds.',
    publishedAt: '2025-09-12',
    featured: false,
  },
  {
    _type: 'pressArticle',
    _id: 'press-town-country-lifestyle',
    title: 'The Ultimate Guide to Living the Aspen Lifestyle Year-Round',
    sourceName: 'Town & Country',
    url: 'https://townandcountrymag.com',
    excerpt: 'Beyond ski season: how Aspen has transformed into a year-round destination for culture, dining, outdoor adventure, and world-class real estate.',
    publishedAt: '2025-08-18',
    featured: false,
  },
]

async function seedPressArticles() {
  console.log('Creating press article documents...\n')

  for (const article of pressArticles) {
    try {
      const result = await client.createOrReplace(article)
      console.log(`  Created: "${result.title}" (${article.sourceName})`)
    } catch (error) {
      console.error(`  Error creating "${article.title}":`, error.message)
    }
  }

  // Now update the homepage to enable the In the News section with references
  console.log('\nUpdating homepage with In the News section...')
  try {
    await client.patch('homepage')
      .set({
        inTheNews: {
          enabled: true,
          title: 'In the News',
          subtitle: 'As featured in leading publications',
          articles: pressArticles.slice(0, 4).map(a => ({
            _type: 'reference',
            _ref: a._id,
            _key: a._id,
          })),
          limit: 4,
        },
      })
      .commit()
    console.log('  Homepage updated with In the News section\n')
  } catch (error) {
    // If homepage doesn't exist yet, create it
    if (error.message.includes('not found') || error.statusCode === 404) {
      console.log('  Homepage document not found, skipping homepage update.')
      console.log('  You can manually add In the News articles via Sanity Studio.\n')
    } else {
      console.error('  Error updating homepage:', error.message)
    }
  }

  console.log('Done! Visit /in-the-news or the homepage to see the articles.')
}

seedPressArticles()
