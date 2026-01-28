import { defineField, defineType } from 'sanity'

export const testimonialsPage = defineType({
  name: 'testimonialsPage',
  title: 'Testimonials Page',
  type: 'document',
  fields: [
    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main headline for the testimonials page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 2,
      description: 'Supporting text below the main headline',
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
      of: [{ type: 'block' }],
      description: 'Rich text introduction about client testimonials',
    }),

    // Featured Testimonial
    defineField({
      name: 'featuredTestimonial',
      title: 'Featured Testimonial',
      type: 'object',
      description: 'A highlighted testimonial displayed prominently',
      fields: [
        defineField({
          name: 'quote',
          title: 'Quote',
          type: 'text',
          rows: 4,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'author',
          title: 'Author Name',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'role',
          title: 'Role/Description',
          type: 'string',
          description: 'e.g., "Aspen Homeowner" or "Sold in Snowmass Village"',
        }),
        defineField({
          name: 'location',
          title: 'Property Location',
          type: 'string',
          description: 'Location of the property transaction',
        }),
        defineField({
          name: 'transactionType',
          title: 'Transaction Type',
          type: 'string',
          options: {
            list: [
              { title: 'Buyer', value: 'buyer' },
              { title: 'Seller', value: 'seller' },
              { title: 'Both', value: 'both' },
            ],
          },
        }),
        defineField({
          name: 'image',
          title: 'Client Photo',
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
        defineField({
          name: 'propertyImage',
          title: 'Property Image',
          type: 'image',
          options: {
            hotspot: true,
          },
          description: 'Optional image of the property involved in the transaction',
        }),
      ],
    }),

    // Testimonials List
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'testimonial',
          title: 'Testimonial',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 4,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'author',
              title: 'Author Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Role/Description',
              type: 'string',
              description: 'e.g., "Aspen Homeowner" or "Sold in Snowmass Village"',
            }),
            defineField({
              name: 'location',
              title: 'Property Location',
              type: 'string',
            }),
            defineField({
              name: 'transactionType',
              title: 'Transaction Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Buyer', value: 'buyer' },
                  { title: 'Seller', value: 'seller' },
                  { title: 'Both', value: 'both' },
                ],
              },
            }),
            defineField({
              name: 'year',
              title: 'Year',
              type: 'string',
              description: 'Year of the transaction',
            }),
            defineField({
              name: 'image',
              title: 'Client Photo',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'featured',
              title: 'Show in Featured Section',
              type: 'boolean',
              description: 'Display this testimonial in the featured grid',
              initialValue: false,
            }),
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

    // Video Testimonials Section
    defineField({
      name: 'videoTestimonialsTitle',
      title: 'Video Testimonials Section Title',
      type: 'string',
    }),
    defineField({
      name: 'videoTestimonials',
      title: 'Video Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'videoTestimonial',
          title: 'Video Testimonial',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'videoUrl',
              title: 'Video URL',
              type: 'url',
              description: 'YouTube or Vimeo URL',
            }),
            defineField({
              name: 'thumbnail',
              title: 'Video Thumbnail',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'clientName',
              title: 'Client Name',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'clientName',
              media: 'thumbnail',
            },
          },
        },
      ],
    }),

    // Statistics Section
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
          name: 'statistic',
          title: 'Statistic',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g., "100+", "98%", "$500M"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g., "Happy Clients", "Satisfaction Rate"',
              validation: (Rule) => Rule.required(),
            }),
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

    // CTA Section
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
      title: 'SEO Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Title for search engines (50-60 characters recommended)',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Description for search engines (150-160 characters recommended)',
        }),
        defineField({
          name: 'ogImage',
          title: 'Social Share Image',
          type: 'image',
          description: 'Image displayed when sharing on social media (1200x630 recommended)',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle',
    },
    prepare() {
      return {
        title: 'Testimonials Page',
        subtitle: 'Client testimonials and reviews',
      }
    },
  },
})
