import { defineType, defineField } from 'sanity'

const MAIN_ID = 'affiliatedPartnersPageMain'
// Treat both the published doc and its draft (drafts.<id>) as the same logical doc
const idMatches = (documentId: string | undefined, target: string) =>
  documentId?.replace(/^drafts\./, '') === target

export const affiliatedPartnersPage = defineType({
  name: 'affiliatedPartnersPage',
  title: 'Affiliated Partners Page',
  type: 'document',
  fields: [
    defineField({
      name: 'pageType',
      title: 'Page Type (legacy)',
      type: 'string',
      description:
        'Kept for backwards compatibility. The page each singleton powers is now determined by the document ID, so this field can be left blank.',
      hidden: true,
    }),

    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main heading for the page hero section',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 3,
      description: 'Subheading text below the title',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      description: 'Optional background image for the hero section',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'logo',
      title: 'Section Logo',
      type: 'image',
      description: 'Optional logo displayed in the hero section',
      options: {
        hotspot: true,
      },
    }),

    // Category Cards (only for main page)
    defineField({
      name: 'skiTownCard',
      title: 'Ski Town Category Card',
      type: 'object',
      hidden: ({ document }) => !idMatches(document?._id, MAIN_ID),
      fields: [
        {
          name: 'title',
          title: 'Card Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Card Description',
          type: 'text',
          rows: 2,
        },
        {
          name: 'image',
          title: 'Card Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'icon',
          title: 'Custom Icon SVG',
          type: 'text',
          description: 'Optional: Paste SVG code for a custom icon (replaces default icon)',
          rows: 4,
        },
      ],
    }),
    defineField({
      name: 'marketLeadersCard',
      title: 'Market Leaders Category Card',
      type: 'object',
      hidden: ({ document }) => !idMatches(document?._id, MAIN_ID),
      fields: [
        {
          name: 'title',
          title: 'Card Title',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Card Description',
          type: 'text',
          rows: 2,
        },
        {
          name: 'image',
          title: 'Card Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'icon',
          title: 'Custom Icon SVG',
          type: 'text',
          description: 'Optional: Paste SVG code for a custom icon (replaces default icon)',
          rows: 4,
        },
      ],
    }),

    // Featured Section (only for main page)
    defineField({
      name: 'featuredSectionTitle',
      title: 'Featured Section Title',
      type: 'string',
      hidden: ({ document }) => !idMatches(document?._id, MAIN_ID),
      description: 'Title for the featured partners section',
    }),

    // CTA Section
    defineField({
      name: 'ctaTitle',
      title: 'CTA Section Title',
      type: 'string',
      description: 'Heading for the call-to-action section at the bottom',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'CTA Section Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ctaButtonText',
      title: 'CTA Button Text',
      type: 'string',
    }),
    defineField({
      name: 'ctaButtonAction',
      title: 'CTA Button Action',
      type: 'string',
      options: {
        list: [
          { title: 'Link to Page', value: 'link' },
          { title: 'Open Contact Modal', value: 'contact_modal' },
        ],
        layout: 'radio',
      },
      initialValue: 'link',
      description: 'Choose whether the button links to a page or opens the contact modal',
    }),
    defineField({
      name: 'ctaButtonLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'URL or path for the CTA button (only used if "Link to Page" is selected)',
      hidden: ({ parent }) => parent?.ctaButtonAction === 'contact_modal',
    }),

  ],
  preview: {
    select: {
      title: 'heroTitle',
      media: 'logo',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Affiliated Partners Page',
        subtitle: 'Page',
        media,
      }
    },
  },
})
