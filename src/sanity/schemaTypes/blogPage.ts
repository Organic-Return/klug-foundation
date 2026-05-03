import { defineType, defineField } from 'sanity'

export const blogPage = defineType({
  name: 'blogPage',
  title: 'Blog Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      initialValue: 'Blog',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Insights, market updates, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.',
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
      title: 'Latest Post — Eyebrow Label',
      type: 'string',
      initialValue: 'Latest Post',
    }),
    defineField({
      name: 'moreArticlesTitle',
      title: 'More Articles — Section Title',
      type: 'string',
      initialValue: 'More Articles',
    }),

    defineField({
      name: 'emptyTitle',
      title: 'Empty State — Title',
      type: 'string',
      initialValue: 'No Posts Yet',
    }),
    defineField({
      name: 'emptyText',
      title: 'Empty State — Body',
      type: 'string',
      initialValue: 'Blog posts will be published soon. Check back later.',
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
      return { title: title || 'Blog', subtitle: 'Page', media }
    },
  },
})
