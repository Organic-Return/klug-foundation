import { defineType, defineField } from 'sanity'

export const teamPage = defineType({
  name: 'teamPage',
  title: 'Team Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      initialValue: 'Our Team',
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Hero Eyebrow',
      type: 'string',
      description: 'Small uppercase label above the hero title (gold).',
      initialValue: 'Klug Properties',
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Description',
      type: 'text',
      rows: 5,
      initialValue:
        'Three full-time licensed real estate professionals born and raised in Colorado and the Roaring Fork Valley with over 25 years of combined real estate success and over $1 billion in career sales. We love this community and what we do, and we are passionate about sharing it and giving back through the Chris Klug Foundation and other local non-profits we support, such as the Aspen Center for Environmental Studies, Independence Pass Foundation, and Aspen Cycling Club.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      description:
        'Optional background photo for the hero band. Falls back to the Site Settings → Default Hero Image when empty.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'stats',
      title: 'Stats Strip',
      type: 'array',
      description: 'Up to four large value/label callouts shown beneath the hero.',
      validation: (Rule) => Rule.max(4),
      of: [
        {
          type: 'object',
          fields: [
            { name: 'value', title: 'Value', type: 'string', description: 'e.g. "$1B+", "25+", "3"' },
            { name: 'label', title: 'Label', type: 'string', description: 'Short caption beneath the value' },
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
      initialValue: [
        { value: '25+', label: 'Years Combined Experience' },
        { value: '$1B+', label: 'In Career Sales' },
        { value: '3', label: 'Licensed Brokers' },
      ],
    }),

    defineField({
      name: 'membersSectionTitle',
      title: 'Members Section — Eyebrow',
      type: 'string',
      description: 'Small label above the team-member roster.',
      initialValue: 'Meet the Team',
    }),

    defineField({
      name: 'philosophyTitle',
      title: 'Philosophy — Title',
      type: 'string',
      initialValue: 'Rooted in This Community',
    }),
    defineField({
      name: 'philosophyContent',
      title: 'Philosophy — Body',
      type: 'text',
      rows: 6,
      initialValue:
        'We love this community and what we do, and we are passionate about sharing it and giving back. Our team supports the Chris Klug Foundation, the Aspen Center for Environmental Studies, the Independence Pass Foundation, and the Aspen Cycling Club — among other Roaring Fork Valley non-profits.',
    }),
    defineField({
      name: 'philosophyImage',
      title: 'Philosophy — Image',
      type: 'image',
      description: 'Optional photo paired with the Philosophy block.',
      options: { hotspot: true },
    }),

    defineField({
      name: 'ctaTitle',
      title: 'Bottom CTA — Title',
      type: 'string',
      initialValue: 'Work With the Team',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'Bottom CTA — Description',
      type: 'text',
      rows: 3,
      initialValue:
        'Whether you are buying or selling, the Klug Properties team is ready to help you make the most of the Roaring Fork Valley market.',
    }),
    defineField({
      name: 'ctaButtonLabel',
      title: 'Bottom CTA — Button Label',
      type: 'string',
      initialValue: 'Contact Us',
    }),
    defineField({
      name: 'ctaButtonHref',
      title: 'Bottom CTA — Button Link',
      type: 'string',
      initialValue: '/contact-us',
    }),

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
    select: { title: 'heroTitle', media: 'heroImage' },
    prepare({ title, media }) {
      return { title: title || 'Team Page', subtitle: 'Page', media }
    },
  },
})
