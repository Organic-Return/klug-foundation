import { defineType, defineField } from 'sanity'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier (auto-generated from name)',
      options: {
        source: 'name',
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Job Title',
      type: 'string',
      description: 'e.g., Real Estate Broker, Sales Associate',
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 10,
      description: 'Full biography text',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      description: 'Professional headshot or team photo',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'mobile',
      title: 'Mobile',
      type: 'string',
    }),
    defineField({
      name: 'office',
      title: 'Office Phone',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Office Address',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter/X URL',
          type: 'url',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn URL',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'mlsAgentId',
      title: 'MLS Agent ID',
      type: 'string',
      description: 'The agent\'s MLS ID for active listings. Enter the ID exactly as it appears in the MLS.',
    }),
    defineField({
      name: 'mlsAgentIdSold',
      title: 'MLS Agent ID (Sold Listings)',
      type: 'string',
      description: 'An additional MLS ID to use for sold listing data. Leave blank to use the same ID as above.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which this team member appears (lower numbers appear first)',
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Show this team member on the homepage',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'title',
      media: 'image',
    },
  },
})
