import { defineType, defineField } from 'sanity'

export const marketReportsPage = defineType({
  name: 'marketReportsPage',
  title: 'Market Reports Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main h1 at the top of /market-reports',
      initialValue: 'Market Reports',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        'In-depth analysis and insights into the luxury real estate market. Stay informed with our comprehensive reports.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      description:
        'Optional background photo for the hero band. When set, it replaces the solid blue background. The hero title and description sit on top with a dark overlay for contrast.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'featuredEyebrow',
      title: 'Featured Report — Eyebrow Label',
      type: 'string',
      description: 'Small label shown above the featured report title.',
      initialValue: 'Featured Report',
    }),

    defineField({
      name: 'allReportsTitle',
      title: 'All Reports — Section Title',
      type: 'string',
      initialValue: 'All Reports',
    }),

    defineField({
      name: 'emptyTitle',
      title: 'Empty State — Title',
      type: 'string',
      description: 'Shown when no reports have been published yet.',
      initialValue: 'No Reports Available',
    }),
    defineField({
      name: 'emptyText',
      title: 'Empty State — Body',
      type: 'string',
      initialValue: 'Market reports will be published soon. Check back later.',
    }),

    defineField({
      name: 'ctaTitle',
      title: 'Bottom CTA — Title',
      type: 'string',
      initialValue: 'Request a Custom Analysis',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'Bottom CTA — Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Need market insights for a specific area or property type? Our team can provide tailored analysis for your needs.',
    }),
    defineField({
      name: 'ctaButtonLabel',
      title: 'Bottom CTA — Button Label',
      type: 'string',
      initialValue: 'Contact Us',
    }),
    defineField({
      name: 'ctaButtonHref',
      title: 'Bottom CTA — Button Link',
      type: 'string',
      description: 'Path or URL for the CTA button.',
      initialValue: '/contact-us',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 3 },
        { name: 'ogImage', title: 'Open Graph Image', type: 'image' },
      ],
    }),
  ],
  preview: {
    select: { title: 'heroTitle', media: 'heroImage' },
    prepare({ title, media }) {
      return { title: title || 'Market Reports', subtitle: 'Page', media }
    },
  },
})
