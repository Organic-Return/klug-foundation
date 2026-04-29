import { defineType, defineField } from 'sanity'

export const exclusiveAndNewPage = defineType({
  name: 'exclusiveAndNewPage',
  title: 'Exclusive and New Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main h1 at the top of /exclusive-and-new',
      initialValue: 'Exclusive and New',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      initialValue:
        "Chris Klug's current exclusive listings, alongside the freshest single family homes to hit the Aspen market. Updated continuously from the MLS.",
    }),

    defineField({
      name: 'agent',
      title: 'Featured Agent',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      description:
        'Whose active listings appear in the first section. Defaults to Chris Klug if not set.',
    }),

    defineField({
      name: 'exclusiveSectionTitle',
      title: 'Exclusive Section Title',
      type: 'string',
      initialValue: 'Current Listings',
    }),
    defineField({
      name: 'exclusiveEmptyText',
      title: 'Exclusive Section — Empty State Text',
      type: 'string',
      initialValue: 'No active listings at this time.',
    }),

    defineField({
      name: 'newestCity',
      title: 'Newest Listings — City',
      type: 'string',
      description: 'City to pull newest single-family listings from.',
      initialValue: 'Aspen',
    }),
    defineField({
      name: 'newestLimit',
      title: 'Newest Listings — Count',
      type: 'number',
      description: 'How many newest single-family homes to show.',
      initialValue: 10,
      validation: (Rule) => Rule.min(1).max(50),
    }),
    defineField({
      name: 'newestSectionTitle',
      title: 'Newest Section Title',
      type: 'string',
      initialValue: 'Newest Aspen Single Family Homes',
    }),
    defineField({
      name: 'newestSectionDescription',
      title: 'Newest Section — Description',
      type: 'text',
      rows: 2,
      initialValue:
        'The ten most recently listed single family residences in Aspen, refreshed continuously from the Aspen Glenwood MLS.',
    }),
    defineField({
      name: 'newestEmptyText',
      title: 'Newest Section — Empty State Text',
      type: 'string',
      initialValue: 'No new Aspen listings available.',
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
    select: { title: 'heroTitle' },
    prepare({ title }) {
      return { title: title || 'Exclusive and New', subtitle: 'Page' }
    },
  },
})
