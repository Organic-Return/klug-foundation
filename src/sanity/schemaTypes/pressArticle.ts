import { defineType, defineField } from 'sanity'

export const pressArticle = defineType({
  name: 'pressArticle',
  title: 'Press Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Article Title',
      type: 'string',
      description: 'The headline of the article',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Page URL on klugproperties.com. When set, the card links to an internal summary page (with a CTA to the original article). When empty, the card links straight to the external URL.',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'sourceName',
      title: 'Publication Name',
      type: 'string',
      description: 'e.g. Robb Report, Wall Street Journal, Forbes',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceLogo',
      title: 'Publication Logo',
      type: 'image',
      description: 'Logo of the publication (displayed on the card)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'url',
      title: 'Article URL',
      type: 'url',
      description: 'Link to the original article',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      description: 'Article thumbnail or featured image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Brief description or pull quote — shown on the card and at the top of the summary page.',
    }),
    defineField({
      name: 'body',
      title: 'Summary Content',
      type: 'array',
      description:
        'Optional long-form summary of the article. Renders as the main content on the internal summary page; the external article URL still appears as a "Read the full story" CTA.',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', type: 'string', title: 'Alt text' },
            { name: 'caption', type: 'string', title: 'Caption' },
          ],
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'date',
      description: 'When the article was published',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Mark as featured to highlight on the homepage',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sourceName',
      media: 'image',
      date: 'publishedAt',
    },
    prepare({ title, subtitle, media, date }) {
      return {
        title: title || 'Untitled',
        subtitle: `${subtitle || 'Unknown source'}${date ? ` — ${date}` : ''}`,
        media,
      }
    },
  },
})
