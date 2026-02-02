import { defineType, defineField } from 'sanity'

export const propertyEnhancement = defineType({
  name: 'propertyEnhancement',
  title: 'Property Enhancement',
  type: 'document',
  description: 'Add videos and documents to MLS properties',
  fields: [
    defineField({
      name: 'mlsNumber',
      title: 'MLS Number',
      type: 'string',
      description: 'The MLS ID of the property to enhance',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'propertyAddress',
      title: 'Property Address',
      type: 'string',
      description: 'Optional: Property address for reference (helps identify the property in the list)',
    }),
    defineField({
      name: 'videos',
      title: 'Property Videos',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'video',
          title: 'Video',
          fields: [
            {
              name: 'title',
              title: 'Video Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'videoType',
              title: 'Video Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Mux Video', value: 'mux' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'Vimeo', value: 'vimeo' },
                  { title: 'External URL', value: 'url' },
                ],
                layout: 'radio',
              },
              initialValue: 'mux',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'muxPlaybackId',
              title: 'Mux Playback ID',
              type: 'string',
              description: 'The Mux playback ID for the video',
              hidden: ({ parent }) => parent?.videoType !== 'mux',
            },
            {
              name: 'youtubeId',
              title: 'YouTube Video ID',
              type: 'string',
              description: 'The YouTube video ID (e.g., "dQw4w9WgXcQ" from the URL)',
              hidden: ({ parent }) => parent?.videoType !== 'youtube',
            },
            {
              name: 'vimeoId',
              title: 'Vimeo Video ID',
              type: 'string',
              description: 'The Vimeo video ID (e.g., "123456789")',
              hidden: ({ parent }) => parent?.videoType !== 'vimeo',
            },
            {
              name: 'externalUrl',
              title: 'External Video URL',
              type: 'url',
              description: 'Direct URL to an external video file',
              hidden: ({ parent }) => parent?.videoType !== 'url',
            },
            {
              name: 'thumbnail',
              title: 'Custom Thumbnail',
              type: 'image',
              description: 'Optional custom thumbnail for the video',
              options: {
                hotspot: true,
              },
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional description for the video',
            },
          ],
          preview: {
            select: {
              title: 'title',
              videoType: 'videoType',
              media: 'thumbnail',
            },
            prepare({ title, videoType, media }) {
              const typeLabels: Record<string, string> = {
                mux: 'Mux',
                youtube: 'YouTube',
                vimeo: 'Vimeo',
                url: 'External',
              }
              return {
                title: title || 'Untitled Video',
                subtitle: typeLabels[videoType] || 'Video',
                media: media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'documents',
      title: 'Property Documents',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'propertyDocument',
          title: 'Document',
          fields: [
            {
              name: 'title',
              title: 'Document Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'documentType',
              title: 'Document Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Floor Plan', value: 'floor_plan' },
                  { title: 'Brochure', value: 'brochure' },
                  { title: 'Survey', value: 'survey' },
                  { title: 'Disclosures', value: 'disclosures' },
                  { title: 'HOA Documents', value: 'hoa' },
                  { title: 'Inspection Report', value: 'inspection' },
                  { title: 'Other', value: 'other' },
                ],
              },
              initialValue: 'other',
            },
            {
              name: 'file',
              title: 'File',
              type: 'file',
              options: {
                accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
              description: 'Optional description for the document',
            },
          ],
          preview: {
            select: {
              title: 'title',
              documentType: 'documentType',
            },
            prepare({ title, documentType }) {
              const typeLabels: Record<string, string> = {
                floor_plan: 'Floor Plan',
                brochure: 'Brochure',
                survey: 'Survey',
                disclosures: 'Disclosures',
                hoa: 'HOA Documents',
                inspection: 'Inspection Report',
                other: 'Document',
              }
              return {
                title: title || 'Untitled Document',
                subtitle: typeLabels[documentType] || 'Document',
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      mlsNumber: 'mlsNumber',
      propertyAddress: 'propertyAddress',
      videos: 'videos',
      documents: 'documents',
    },
    prepare({ mlsNumber, propertyAddress, videos, documents }) {
      const videoCount = videos?.length || 0
      const docCount = documents?.length || 0
      const parts = []
      if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`)
      if (docCount > 0) parts.push(`${docCount} doc${docCount > 1 ? 's' : ''}`)

      return {
        title: propertyAddress || `MLS# ${mlsNumber}`,
        subtitle: `MLS# ${mlsNumber} • ${parts.join(', ') || 'No media'}`,
      }
    },
  },
  orderings: [
    {
      title: 'MLS Number',
      name: 'mlsNumberAsc',
      by: [{ field: 'mlsNumber', direction: 'asc' }],
    },
  ],
})
