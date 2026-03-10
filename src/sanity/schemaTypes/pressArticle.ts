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
      description: 'Brief description or pull quote from the article',
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
