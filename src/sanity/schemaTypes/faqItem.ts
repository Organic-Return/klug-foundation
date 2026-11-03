import { defineType, defineField } from 'sanity'

/**
 * One question and answer. Used by the FAQ sections on community, blog post,
 * about and site-level settings. Rendered visibly on the page and mirrored
 * word for word into the page's FAQPage structured data.
 */
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [{ title: 'Bullet', value: 'bullet' }] }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'question' } },
})

export const faqsField = (description: string) => ({
  name: 'faqs',
  title: 'Frequently Asked Questions',
  type: 'array',
  of: [{ type: 'faqItem' }],
  description,
})
