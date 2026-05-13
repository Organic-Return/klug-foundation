import { defineType, defineField } from 'sanity'

export const videosPage = defineType({
  name: 'videosPage',
  title: 'Videos Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      initialValue: 'Videos',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Watch our latest real estate videos, property tours, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.',
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
      name: 'sectionTitle',
      title: 'Above-Grid — Section Title',
      type: 'string',
      description: 'Heading shown directly above the videos grid.',
      initialValue: 'Latest Videos',
    }),
    defineField({
      name: 'sectionDescription',
      title: 'Above-Grid — Description',
      type: 'text',
      rows: 3,
      description: 'Short paragraph displayed under the section title.',
    }),

    defineField({
      name: 'emptyTitle',
      title: 'Empty State — Title',
      type: 'string',
      initialValue: 'No Videos Yet',
    }),
    defineField({
      name: 'emptyText',
      title: 'Empty State — Body',
      type: 'string',
      initialValue:
        'New videos and virtual property tours will appear here. Check back soon.',
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
      return { title: title || 'Videos', subtitle: 'Page', media }
    },
  },
})
