import { defineType, defineField } from 'sanity'

export const soldByKlugPage = defineType({
  name: 'soldByKlugPage',
  title: 'Sold by Klug Properties Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main h1 at the top of /sold-by-klug-properties',
      initialValue: 'Sold by Klug Properties',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 4,
      initialValue:
        "Properties closed by Chris Klug and the Klug Properties team across Aspen, Snowmass Village, and the Roaring Fork Valley — representing buyers and sellers in Colorado's most prestigious mountain communities.",
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
      name: 'showStats',
      title: 'Show Stats Band',
      type: 'boolean',
      description: 'Display the "Properties Sold / Total Sales Volume" band beneath the hero.',
      initialValue: true,
    }),
    defineField({
      name: 'statsPropertiesLabel',
      title: 'Stats — Properties Label',
      type: 'string',
      initialValue: 'Properties Sold',
    }),
    defineField({
      name: 'statsVolumeLabel',
      title: 'Stats — Volume Label',
      type: 'string',
      initialValue: 'Total Sales Volume',
    }),

    defineField({
      name: 'emptyText',
      title: 'Empty State Text',
      type: 'string',
      description: 'Shown when there are no sold listings to display.',
      initialValue: 'No sold listings available yet.',
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
      return { title: title || 'Sold by Klug Properties', subtitle: 'Page', media }
    },
  },
})
