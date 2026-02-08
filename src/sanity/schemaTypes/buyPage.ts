import { defineType, defineField } from 'sanity'

export const buyPage = defineType({
  name: 'buyPage',
  title: 'Buy Page',
  type: 'document',
  fields: [
    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main headline for the buy page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 4,
      description: 'Introductory paragraph displayed below the hero title',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // Content Sections (flexible editorial blocks)
    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      description: 'Add content sections to the page (e.g., Where To Buy, What To Buy, Who To Trust)',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Section Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [
                    { title: 'Normal', value: 'normal' },
                    { title: 'H2', value: 'h2' },
                    { title: 'H3', value: 'h3' },
                    { title: 'Quote', value: 'blockquote' },
                  ],
                  marks: {
                    decorators: [
                      { title: 'Strong', value: 'strong' },
                      { title: 'Emphasis', value: 'em' },
                    ],
                  },
                },
              ],
            },
            {
              name: 'image',
              title: 'Section Image',
              type: 'image',
              description: 'Optional image displayed alongside the content',
              options: {
                hotspot: true,
              },
            },
            {
              name: 'imagePosition',
              title: 'Image Position',
              type: 'string',
              description: 'Where to display the image relative to the content',
              options: {
                list: [
                  { title: 'Left', value: 'left' },
                  { title: 'Right', value: 'right' },
                ],
                layout: 'radio',
              },
              initialValue: 'right',
            },
            {
              name: 'ctaText',
              title: 'Button Text',
              type: 'string',
              description: 'Optional call-to-action button text',
            },
            {
              name: 'ctaLink',
              title: 'Button Link',
              type: 'string',
              description: 'URL for the call-to-action button',
            },
          ],
          preview: {
            select: {
              title: 'title',
              media: 'image',
            },
          },
        },
      ],
    }),

    // FAQ Section
    defineField({
      name: 'faqTitle',
      title: 'FAQ Section Title',
      type: 'string',
    }),
    defineField({
      name: 'faqs',
      title: 'Frequently Asked Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'question',
            },
          },
        },
      ],
    }),

    // Call to Action
    defineField({
      name: 'ctaTitle',
      title: 'CTA Title',
      type: 'string',
    }),
    defineField({
      name: 'ctaSubtitle',
      title: 'CTA Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ctaButtonText',
      title: 'CTA Button Text',
      type: 'string',
    }),
    defineField({
      name: 'ctaButtonLink',
      title: 'CTA Button Link',
      type: 'string',
    }),
    defineField({
      name: 'ctaImage',
      title: 'CTA Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'SEO title (recommended: 50-60 characters)',
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'SEO description (recommended: 150-160 characters)',
        },
        {
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
          description: 'Image for social sharing (recommended: 1200x630px)',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle',
      media: 'heroImage',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Buy Page',
        subtitle: 'Buyer Guide',
        media: media,
      }
    },
  },
})
