import { defineType, defineField } from 'sanity'

export const builder = defineType({
  name: 'builder',
  title: 'Builder',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Builder Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 8,
      description: 'Plain text description of the builder (HTML from import is stored in descriptionHtml)',
    }),
    defineField({
      name: 'descriptionHtml',
      title: 'Description (HTML)',
      type: 'text',
      rows: 12,
      description: 'Rich HTML description imported from the original site',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'agentMlsIds',
      title: 'Representing Agent MLS IDs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'MLS IDs of agents representing this builder',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in the builders grid (lower numbers appear first)',
    }),
  ],
  orderings: [
    {
      title: 'Name',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
    },
  },
})
