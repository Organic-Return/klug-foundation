import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1zb39xqr',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})

const whyKlugContent = {
  _type: 'whyKlugProperties',
  _id: 'whyKlugProperties',

  // Hero Section
  heroTitle: 'Experience Luxury Real Estate Excellence',
  heroSubtitle: 'Discover why discerning clients choose Klug Properties for their most important real estate decisions in the Aspen and Roaring Fork Valley.',

  // Introduction Section
  introTitle: 'A Different Approach to Luxury Real Estate',
  introContent: [
    {
      _type: 'block',
      _key: 'intro1',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'intro1span',
          text: 'At Klug Properties, we believe that buying or selling a luxury home should be an exceptional experience from start to finish. Our boutique approach means you receive personalized attention and strategic guidance tailored to your unique needs.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      _key: 'intro2',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'intro2span',
          text: 'With deep roots in the Aspen community and an extensive network of connections, we provide insider access to opportunities that others simply cannot offer. Our commitment to excellence has made us a trusted name in mountain luxury real estate.',
          marks: [],
        },
      ],
    },
  ],

  // Services Section
  servicesTitle: 'What Sets Us Apart',
  servicesSubtitle: 'Our comprehensive approach ensures every aspect of your real estate journey is handled with expertise and care.',
  services: [
    {
      _key: 'service1',
      title: 'Local Market Expertise',
      description: 'Deep knowledge of Aspen, Snowmass, and the Roaring Fork Valley markets, including off-market opportunities and emerging neighborhoods.',
      icon: 'home',
    },
    {
      _key: 'service2',
      title: 'Data-Driven Strategy',
      description: 'Comprehensive market analysis and pricing strategies backed by real-time data to ensure optimal outcomes for buyers and sellers.',
      icon: 'chart',
    },
    {
      _key: 'service3',
      title: 'Professional Photography & Media',
      description: 'Stunning professional photography, videography, drone footage, and virtual tours that showcase properties at their absolute best.',
      icon: 'camera',
    },
    {
      _key: 'service4',
      title: 'Global Marketing Reach',
      description: 'Targeted digital marketing campaigns and syndication to luxury real estate platforms reaching qualified buyers worldwide.',
      icon: 'globe',
    },
    {
      _key: 'service5',
      title: 'White-Glove Service',
      description: 'Personalized concierge-level service throughout the entire transaction, handling every detail so you can focus on what matters.',
      icon: 'handshake',
    },
    {
      _key: 'service6',
      title: 'Proven Track Record',
      description: 'A history of successful transactions and satisfied clients who return to us again and again for their real estate needs.',
      icon: 'star',
    },
  ],

  // Statistics Section
  statsTitle: 'Results That Speak for Themselves',
  statistics: [
    {
      _key: 'stat1',
      value: '$500M+',
      label: 'Total Sales Volume',
      description: 'In career transactions',
    },
    {
      _key: 'stat2',
      value: '15+',
      label: 'Years Experience',
      description: 'In luxury real estate',
    },
    {
      _key: 'stat3',
      value: '98%',
      label: 'Client Satisfaction',
      description: 'Would recommend us',
    },
    {
      _key: 'stat4',
      value: '50+',
      label: 'Transactions Annually',
      description: 'Successful closings',
    },
  ],

  // Marketing Features Section
  marketingTitle: 'Bespoke Marketing for Exceptional Properties',
  marketingSubtitle: 'Every property deserves a custom marketing strategy designed to attract the right buyers and achieve the best possible outcome.',
  marketingFeatures: [
    {
      _key: 'marketing1',
      title: 'Cinematic Property Films',
      description: 'We create stunning cinematic property films that tell the story of your home, capturing its unique character, lifestyle, and the surrounding mountain beauty. These films are distributed across premium channels to reach qualified luxury buyers.',
    },
    {
      _key: 'marketing2',
      title: 'Targeted Digital Campaigns',
      description: 'Our data-driven digital marketing strategies target high-net-worth individuals actively searching for luxury mountain properties. We leverage advanced targeting on social media, search engines, and luxury lifestyle platforms.',
    },
    {
      _key: 'marketing3',
      title: 'Print & Publication Features',
      description: 'Strategic placement in prestigious publications including Aspen Magazine, Luxe Interiors + Design, and international luxury real estate publications ensures your property reaches discerning buyers worldwide.',
    },
    {
      _key: 'marketing4',
      title: 'Private Network Access',
      description: 'Our extensive network of luxury agents, wealth managers, and high-net-worth individuals provides access to qualified buyers before properties hit the public market, often resulting in faster sales at premium prices.',
    },
  ],

  // Process Section
  processTitle: 'Our Proven Process',
  processSubtitle: 'A systematic approach that delivers exceptional results at every stage.',
  processSteps: [
    {
      _key: 'step1',
      stepNumber: '01',
      title: 'Discovery & Consultation',
      description: 'We begin with an in-depth consultation to understand your goals, timeline, and unique requirements. For sellers, we conduct a comprehensive property evaluation.',
    },
    {
      _key: 'step2',
      stepNumber: '02',
      title: 'Strategy Development',
      description: 'Based on market analysis and your objectives, we develop a customized strategy—whether that\'s a targeted buyer search or a comprehensive marketing plan for sellers.',
    },
    {
      _key: 'step3',
      stepNumber: '03',
      title: 'Execution & Negotiation',
      description: 'We execute the strategy with precision, leveraging our expertise to negotiate the best possible terms while keeping you informed every step of the way.',
    },
    {
      _key: 'step4',
      stepNumber: '04',
      title: 'Closing & Beyond',
      description: 'We manage all closing details and continue to be a resource long after the transaction, helping with recommendations for local services, contractors, and more.',
    },
  ],

  // Testimonials Section
  testimonialsTitle: 'What Our Clients Say',
  testimonials: [
    {
      _key: 'testimonial1',
      quote: 'Working with Klug Properties was an absolute pleasure. Their knowledge of the Aspen market is unparalleled, and they found us our dream home before it even hit the market.',
      author: 'Michael & Sarah T.',
      role: 'Aspen Homeowners',
    },
    {
      _key: 'testimonial2',
      quote: 'The marketing they created for our property was stunning. We received multiple offers within the first week and sold well above asking price.',
      author: 'Jennifer L.',
      role: 'Snowmass Village Seller',
    },
    {
      _key: 'testimonial3',
      quote: 'Professional, responsive, and truly dedicated to finding the perfect property. They made the entire process seamless despite us being out of state buyers.',
      author: 'David & Amanda R.',
      role: 'Second Home Buyers',
    },
  ],

  // CTA Section
  ctaTitle: 'Ready to Begin Your Journey?',
  ctaSubtitle: 'Whether you\'re buying or selling, let\'s discuss how we can help you achieve your real estate goals in the Aspen area.',
  ctaButtonText: 'Schedule a Consultation',
  ctaButtonLink: '/contact-us',

  // SEO
  seo: {
    metaTitle: 'Why Choose Klug Properties | Luxury Aspen Real Estate',
    metaDescription: 'Discover why discerning clients choose Klug Properties for luxury real estate in Aspen, Snowmass, and the Roaring Fork Valley. Expert guidance, bespoke marketing, and white-glove service.',
  },
}

async function seedContent() {
  console.log('Creating Why Klug Properties content...')

  try {
    const result = await client.createOrReplace(whyKlugContent)
    console.log('Successfully created document:', result._id)
  } catch (error) {
    console.error('Error creating document:', error.message)

    if (error.message.includes('token')) {
      console.log('\n---')
      console.log('To run this script, you need a Sanity write token.')
      console.log('1. Go to https://www.sanity.io/manage')
      console.log('2. Select your project (1zb39xqr)')
      console.log('3. Go to API > Tokens')
      console.log('4. Create a token with "Editor" permissions')
      console.log('5. Run: SANITY_WRITE_TOKEN=your_token node scripts/seed-why-klug.mjs')
      console.log('---\n')
    }
  }
}

seedContent()
