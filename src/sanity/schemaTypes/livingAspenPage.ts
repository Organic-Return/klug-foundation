import { defineType, defineField } from 'sanity'

export const livingAspenPage = defineType({
  name: 'livingAspenPage',
  title: 'Living Aspen Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      initialValue: 'Living Aspen',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Discover the essence of Aspen living through our curated magazine. Local culture, design inspiration, and the stories that define mountain luxury.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      description:
        'Optional background photo for the hero band. When set, it replaces the solid blue background. Falls back to the Site Settings → Default Hero Image when empty.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'latestEyebrow',
      title: 'Latest Issue — Eyebrow Label',
      type: 'string',
      initialValue: 'Latest Issue',
    }),
    defineField({
      name: 'pastIssuesTitle',
      title: 'Past Issues — Section Title',
      type: 'string',
      initialValue: 'Past Issues',
    }),

    defineField({
      name: 'emptyTitle',
      title: 'Empty State — Title',
      type: 'string',
      initialValue: 'Coming Soon',
    }),
    defineField({
      name: 'emptyText',
      title: 'Empty State — Body',
      type: 'string',
      initialValue: 'Our first issue of Living Aspen is in the works. Stay tuned.',
    }),

    defineField({
      name: 'ctaTitle',
      title: 'Bottom CTA — Title',
      type: 'string',
      initialValue: 'Stay Connected',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'Bottom CTA — Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Subscribe to receive the latest issue of Living Aspen and exclusive insights into the Aspen lifestyle.',
    }),
    defineField({
      name: 'ctaButtonLabel',
      title: 'Bottom CTA — Button Label',
      type: 'string',
      initialValue: 'Subscribe',
    }),
    defineField({
      name: 'ctaButtonHref',
      title: 'Bottom CTA — Button Link',
      type: 'string',
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
      return { title: title || 'Living Aspen', subtitle: 'Page', media }
    },
  },
})
