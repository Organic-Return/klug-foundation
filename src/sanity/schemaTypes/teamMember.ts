import { defineType, defineField } from 'sanity'
import { TeamMemberAgentImport } from '../components/TeamMemberAgentImport'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'sirAgentId',
      title: 'SIR Agent Import',
      type: 'string',
      description: 'Search the SIR database to auto-populate fields below',
      components: {
        input: TeamMemberAgentImport,
      },
    }),
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
    defineField({
      name: 'realogyId',
      title: 'Realogy ID',
      type: 'string',
      description: 'The rfg_staff_id from the Realogy database (set by sync)',
      readOnly: true,
    }),
    defineField({
      name: 'syncSource',
      title: 'Sync Source',
      type: 'string',
      description: 'How this team member was created',
      options: {
        list: [
          { title: 'Manual', value: 'manual' },
          { title: 'Realogy Sync', value: 'realogy_sync' },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'overrides',
      title: 'Field Overrides',
      type: 'object',
      description: 'Tracks which fields have been manually edited (sync will not overwrite these)',
      hidden: true,
      fields: [
        { name: 'name', type: 'boolean', title: 'Name' },
        { name: 'title', type: 'boolean', title: 'Title' },
        { name: 'bio', type: 'boolean', title: 'Bio' },
        { name: 'email', type: 'boolean', title: 'Email' },
        { name: 'phone', type: 'boolean', title: 'Phone' },
        { name: 'mobile', type: 'boolean', title: 'Mobile' },
        { name: 'office', type: 'boolean', title: 'Office' },
        { name: 'address', type: 'boolean', title: 'Address' },
        { name: 'image', type: 'boolean', title: 'Image' },
        { name: 'mlsAgentId', type: 'boolean', title: 'MLS Agent ID' },
      ],
    }),
    defineField({
      name: 'inactive',
      title: 'Inactive',
      type: 'boolean',
      description: 'Set by sync when agent leaves all configured offices. Hidden from team page.',
      initialValue: false,
    }),
    defineField({
      name: 'lastSyncedAt',
      title: 'Last Synced',
      type: 'datetime',
      description: 'When this record was last updated by sync',
      readOnly: true,
    }),
    defineField({
      name: '_syncPhotoUrl',
      title: 'Sync Photo URL',
      type: 'string',
      description: 'Tracks the last synced photo URL to detect changes',
      hidden: true,
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
