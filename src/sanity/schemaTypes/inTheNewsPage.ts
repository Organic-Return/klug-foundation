import { defineType, defineField } from 'sanity'

export const inTheNewsPage = defineType({
  name: 'inTheNewsPage',
  title: 'In the News Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      initialValue: 'In the News',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        'As featured in leading publications. Browse our latest press coverage and media mentions.',
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
      name: 'featuredEyebrow',
      title: 'Featured Article — Eyebrow Label',
      type: 'string',
      initialValue: 'Featured',
    }),
    defineField({
      name: 'allArticlesTitle',
      title: 'All Articles — Section Title',
      type: 'string',
      initialValue: 'All Articles',
    }),

    defineField({
      name: 'emptyTitle',
      title: 'Empty State — Title',
      type: 'string',
      initialValue: 'No Articles Yet',
    }),
    defineField({
      name: 'emptyText',
      title: 'Empty State — Body',
      type: 'string',
      initialValue: 'Press coverage and media mentions will appear here. Check back soon.',
    }),

    defineField({
      name: 'ctaTitle',
      title: 'Bottom CTA — Title',
      type: 'string',
      initialValue: 'Media Inquiries',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'Bottom CTA — Description',
      type: 'text',
      rows: 3,
      initialValue:
        'For press inquiries, interviews, or media coverage opportunities, please get in touch with our team.',
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
      return { title: title || 'In the News', subtitle: 'Page', media }
    },
  },
})
