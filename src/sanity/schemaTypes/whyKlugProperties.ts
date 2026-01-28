import { defineType, defineField } from 'sanity'

export const whyKlugProperties = defineType({
  name: 'whyKlugProperties',
  title: 'Why Klug Properties',
  type: 'document',
  fields: [
    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main headline for the page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 3,
      description: 'Subtitle or tagline displayed below the hero title',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // Introduction Section
    defineField({
      name: 'introTitle',
      title: 'Introduction Title',
      type: 'string',
      description: 'Title for the introduction section',
    }),
    defineField({
      name: 'introContent',
      title: 'Introduction Content',
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
    }),
    defineField({
      name: 'introImage',
      title: 'Introduction Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // Key Differentiators / Services
    defineField({
      name: 'servicesTitle',
      title: 'Services Section Title',
      type: 'string',
      description: 'Title for the services/differentiators section',
    }),
    defineField({
      name: 'servicesSubtitle',
      title: 'Services Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'services',
      title: 'Services / Differentiators',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Service Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 4,
            },
            {
              name: 'icon',
              title: 'Icon Name',
              type: 'string',
              description: 'Icon identifier (e.g., "home", "chart", "camera", "globe")',
            },
            {
              name: 'image',
              title: 'Service Image',
              type: 'image',
              options: {
                hotspot: true,
              },
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

    // Marketing Approach Section
    defineField({
      name: 'marketingTitle',
      title: 'Marketing Approach Title',
      type: 'string',
    }),
    defineField({
      name: 'marketingSubtitle',
      title: 'Marketing Approach Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'marketingFeatures',
      title: 'Marketing Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Feature Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            },
            {
              name: 'image',
              title: 'Feature Image',
              type: 'image',
              options: {
                hotspot: true,
              },
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
    defineField({
      name: 'marketingImage',
      title: 'Marketing Section Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // Statistics / Accolades
    defineField({
      name: 'statsTitle',
      title: 'Statistics Section Title',
      type: 'string',
    }),
    defineField({
      name: 'statistics',
      title: 'Statistics',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g., "$500M+", "25+", "98%"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g., "In Sales Volume", "Years Experience"',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: {
              title: 'value',
              subtitle: 'label',
            },
          },
        },
      ],
    }),

    // Process Section
    defineField({
      name: 'processTitle',
      title: 'Process Section Title',
      type: 'string',
    }),
    defineField({
      name: 'processSubtitle',
      title: 'Process Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'processSteps',
      title: 'Process Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'stepNumber',
              title: 'Step Number',
              type: 'string',
              description: 'e.g., "01", "02"',
            },
            {
              name: 'title',
              title: 'Step Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            },
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'stepNumber',
            },
            prepare({ title, subtitle }) {
              return {
                title: title,
                subtitle: subtitle ? `Step ${subtitle}` : undefined,
              }
            },
          },
        },
      ],
    }),

    // Testimonials
    defineField({
      name: 'testimonialsTitle',
      title: 'Testimonials Section Title',
      type: 'string',
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'author',
              title: 'Author Name',
              type: 'string',
            },
            {
              name: 'role',
              title: 'Author Role/Location',
              type: 'string',
              description: 'e.g., "Seller, Aspen" or "Buyer, Snowmass"',
            },
            {
              name: 'image',
              title: 'Author Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            },
          ],
          preview: {
            select: {
              title: 'author',
              subtitle: 'role',
              media: 'image',
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
        title: title || 'Why Klug Properties',
        subtitle: 'About Page',
        media: media,
      }
    },
  },
})
