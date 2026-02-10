import { defineType, defineField } from 'sanity'

export const resourcesPage = defineType({
  name: 'resourcesPage',
  title: 'Resources Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
    }),

    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Section Title',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
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
              options: { hotspot: true },
            },
            {
              name: 'imagePosition',
              title: 'Image Position',
              type: 'string',
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
            },
            {
              name: 'ctaLink',
              title: 'Button Link',
              type: 'string',
            },
          ],
          preview: {
            select: { title: 'title', media: 'image' },
          },
        },
      ],
    }),

    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      description: 'Downloadable documents and resources',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'file',
              title: 'File',
              type: 'file',
            },
            {
              name: 'url',
              title: 'External URL',
              type: 'url',
              description: 'Link to external resource (if no file upload)',
            },
            {
              name: 'category',
              title: 'Category',
              type: 'string',
              options: {
                list: [
                  { title: 'Market Reports', value: 'market-reports' },
                  { title: 'Buyer Resources', value: 'buyer' },
                  { title: 'Seller Resources', value: 'seller' },
                  { title: 'Community Guides', value: 'community' },
                  { title: 'Legal & HOA', value: 'legal' },
                  { title: 'Other', value: 'other' },
                ],
              },
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'category' },
          },
        },
      ],
    }),

    defineField({ name: 'ctaTitle', title: 'CTA Title', type: 'string' }),
    defineField({ name: 'ctaSubtitle', title: 'CTA Subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'ctaButtonText', title: 'CTA Button Text', type: 'string' }),
    defineField({ name: 'ctaButtonLink', title: 'CTA Button Link', type: 'string' }),

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
      return { title: title || 'Resources Page', subtitle: 'Resource Center' }
    },
  },
})
