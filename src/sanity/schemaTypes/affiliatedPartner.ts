import { defineField, defineType } from 'sanity'
import { AgentSelector } from '../components/AgentSelector'

export const affiliatedPartner = defineType({
  name: 'affiliatedPartner',
  title: 'Affiliated Partner',
  type: 'document',
  fields: [
    defineField({
      name: 'partnerType',
      title: 'Partner Type',
      type: 'string',
      description: 'Select the type of affiliated partner',
      options: {
        list: [
          { title: 'Ski Town', value: 'ski_town' },
          { title: 'Market Leader', value: 'market_leader' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'ski_town',
    }),
    defineField({
      name: 'agentStaffId',
      title: 'Select Agent',
      type: 'string',
      description: 'Search and select an agent from the database. The first name and last name will be shown after selection.',
      components: {
        input: AgentSelector,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      description: 'Agent\'s first name - enter manually or copy from agent selection above',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      description: 'Agent\'s last name - enter manually or copy from agent selection above',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier (auto-generated from name)',
      options: {
        source: (doc) => `${doc.firstName}-${doc.lastName}`,
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title / Position',
      type: 'string',
      description: 'Optional title or position (e.g., "Broker Associate", "Team Lead")',
    }),
    defineField({
      name: 'company',
      title: 'Company / Brokerage',
      type: 'string',
      description: 'The brokerage or company name',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City or region where this partner operates',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'overridePhoto',
      title: 'Photo',
      type: 'image',
      description: 'Upload the agent\'s headshot photo. This is recommended as the Anywhere API images may not be publicly accessible.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'overrideBio',
      title: 'Override Bio',
      type: 'text',
      rows: 4,
      description: 'Optional: Enter a custom bio to override the one from the database',
    }),
    defineField({
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'Areas of expertise (e.g., "Luxury Homes", "Ski Properties", "Investment")',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first. Partners with the same sort order are sorted alphabetically.',
      initialValue: 0,
    }),
    defineField({
      name: 'featured',
      title: 'Featured Partner',
      type: 'boolean',
      description: 'Show this partner in the featured section',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Set to false to hide this partner from the website',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [
        { field: 'sortOrder', direction: 'asc' },
        { field: 'lastName', direction: 'asc' },
      ],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [
        { field: 'lastName', direction: 'asc' },
        { field: 'firstName', direction: 'asc' },
      ],
    },
    {
      title: 'Partner Type',
      name: 'partnerTypeAsc',
      by: [
        { field: 'partnerType', direction: 'asc' },
        { field: 'lastName', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      partnerType: 'partnerType',
      location: 'location',
      media: 'overridePhoto',
      active: 'active',
    },
    prepare(selection) {
      const { firstName, lastName, partnerType, location, media, active } = selection
      const typeLabels: Record<string, string> = {
        ski_town: 'Ski Town',
        market_leader: 'Market Leader',
      }
      const typeLabel = partnerType ? typeLabels[partnerType] || partnerType : ''
      const statusIndicator = active === false ? '🔴 ' : ''

      return {
        title: `${statusIndicator}${firstName} ${lastName}`,
        subtitle: [typeLabel, location].filter(Boolean).join(' • '),
        media: media,
      }
    },
  },
})
