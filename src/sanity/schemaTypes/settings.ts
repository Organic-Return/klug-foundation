import { defineType, defineField } from 'sanity'

export const settings = defineType({
  name: 'settings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'template',
      title: 'Site Template',
      type: 'string',
      description: 'Choose the visual style for the entire website. This applies globally to all pages.',
      options: {
        list: [
          { title: 'Klug Custom', value: 'classic' },
          { title: 'Luxury', value: 'luxury' },
          { title: 'Modern', value: 'modern' },
          { title: 'Custom One', value: 'custom-one' },
          { title: 'RC Sothebys Custom', value: 'rcsothebys-custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'classic',
    }),
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      description: 'The name of your website',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of your website for SEO',
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      description: 'The full URL of your website (e.g., https://yourdomain.com)',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'listingsPerRow',
      title: 'Listings Per Row (Map View)',
      type: 'number',
      description: 'Number of property cards per row on the listings page when map view is active',
      options: {
        list: [
          { title: '2 per row', value: 2 },
          { title: '3 per row', value: 3 },
        ],
        layout: 'radio',
      },
      initialValue: 2,
    }),
    defineField({
      name: 'branding',
      title: 'Branding',
      type: 'object',
      description: 'Logo and favicon for your website',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        {
          name: 'logo',
          title: 'Site Logo',
          type: 'image',
          description: 'Main logo for your website (recommended: transparent PNG, min width 200px)',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'logoAlt',
          title: 'Logo Alt Text',
          type: 'string',
          description: 'Alternative text for the logo (for accessibility)',
        },
        {
          name: 'favicon',
          title: 'Favicon',
          type: 'image',
          description: 'Favicon for browser tabs (recommended: 32x32px or 64x64px square PNG or ICO)',
          options: {
            accept: 'image/png,image/x-icon,image/vnd.microsoft.icon',
          },
        },
        {
          name: 'appleTouchIcon',
          title: 'Apple Touch Icon',
          type: 'image',
          description: 'Icon for iOS home screen (recommended: 180x180px PNG)',
          options: {
            accept: 'image/png',
          },
        },
      ],
    }),
    defineField({
      name: 'apiKeys',
      title: 'API Keys',
      type: 'object',
      description: 'Manage all API keys and credentials for third-party services',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        {
          name: 'censusApiKey',
          title: 'Census API Key',
          type: 'string',
          description: 'US Census Bureau API key for demographic data. Get yours at: https://api.census.gov/data/key_signup.html',
        },
        {
          name: 'youtubeApiKey',
          title: 'YouTube API Key',
          type: 'string',
          description: 'YouTube Data API v3 key. Get yours at: https://console.cloud.google.com/apis/credentials',
        },
        {
          name: 'youtubeChannelId',
          title: 'YouTube Channel ID',
          type: 'string',
          description: 'Your YouTube channel ID. Find it at: https://www.youtube.com/account_advanced',
        },
        {
          name: 'googleMapsApiKey',
          title: 'Google Maps API Key',
          type: 'string',
          description: 'Google Maps JavaScript API key. Get yours at: https://console.cloud.google.com/google/maps-apis',
        },
        {
          name: 'googleAnalyticsId',
          title: 'Google Analytics Measurement ID',
          type: 'string',
          description: 'Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX). Find it in Google Analytics Admin > Data Streams',
        },
        {
          name: 'googleTagManagerId',
          title: 'Google Tag Manager ID',
          type: 'string',
          description: 'Google Tag Manager Container ID (format: GTM-XXXXXXX). Find it at: https://tagmanager.google.com',
        },
        {
          name: 'googleAdsConversionId',
          title: 'Google Ads Conversion ID',
          type: 'string',
          description: 'Google Ads Conversion ID (format: AW-XXXXXXXXXX). Find it in Google Ads > Tools > Conversions',
        },
        {
          name: 'googleAdsConversionLabel',
          title: 'Google Ads Conversion Label',
          type: 'string',
          description: 'Google Ads Conversion Label for tracking specific conversion actions',
        },
        {
          name: 'facebookPixelId',
          title: 'Facebook Pixel ID',
          type: 'string',
          description: 'Facebook Pixel ID (numeric). Find it in Meta Events Manager: https://business.facebook.com/events_manager',
        },
      ],
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media',
      type: 'object',
      description: 'Social media links and profiles',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter/X URL',
          type: 'url',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn URL',
          type: 'url',
        },
        {
          name: 'youtube',
          title: 'YouTube URL',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      description: 'Primary contact information for your business',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'email',
          title: 'Email',
          type: 'string',
        },
        {
          name: 'phone',
          title: 'Phone',
          type: 'string',
        },
        {
          name: 'address',
          title: 'Address',
          type: 'text',
          rows: 3,
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'Default SEO Settings',
      type: 'object',
      description: 'Default SEO settings for pages without custom meta tags',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'defaultMetaImage',
          title: 'Default Meta Image',
          type: 'image',
          description: 'Default image for social sharing (recommended: 1200x630px)',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'keywords',
          title: 'Default Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Default keywords for SEO',
          options: {
            layout: 'tags',
          },
        },
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer Settings',
      type: 'object',
      description: 'Images and content for the site footer',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        {
          name: 'portraitImage',
          title: 'Portrait Image',
          type: 'image',
          description: 'Agent/team portrait image displayed in the footer (recommended: square aspect ratio)',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'taglineImage',
          title: 'Tagline/Logo Image',
          type: 'image',
          description: 'Tagline or secondary logo image displayed in the footer',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'brokerageLogo',
          title: 'Brokerage Logo',
          type: 'image',
          description: 'Brokerage or affiliate logo (e.g., ASSIR logo)',
          options: {
            hotspot: true,
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Site Settings',
      }
    },
  },
})
