import { defineType, defineField } from 'sanity'

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Navigation Title',
      type: 'string',
      description: 'Internal name for this navigation (e.g., "Main Navigation", "Footer Links")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'identifier',
      title: 'Identifier',
      type: 'string',
      description: 'Unique identifier (e.g., "main", "footer")',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Main Navigation', value: 'main' },
          { title: 'Footer Navigation', value: 'footer' },
        ],
      },
    }),
    defineField({
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navItem',
          title: 'Navigation Item',
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'string',
              description: 'Internal path (e.g., /about) or external URL',
            },
            {
              name: 'openInNewTab',
              title: 'Open in New Tab',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'hasMegaMenu',
              title: 'Has Mega Menu',
              type: 'boolean',
              initialValue: false,
              description: 'Enable mega menu dropdown for this item',
            },
            {
              name: 'megaMenuColumns',
              title: 'Mega Menu Columns',
              type: 'array',
              hidden: ({ parent }) => !parent?.hasMegaMenu,
              of: [
                {
                  type: 'object',
                  name: 'megaMenuColumn',
                  title: 'Column',
                  fields: [
                    {
                      name: 'title',
                      title: 'Column Title',
                      type: 'string',
                    },
                    {
                      name: 'links',
                      title: 'Links',
                      type: 'array',
                      of: [
                        {
                          type: 'object',
                          name: 'megaMenuLink',
                          fields: [
                            {
                              name: 'label',
                              title: 'Label',
                              type: 'string',
                              validation: (Rule) => Rule.required(),
                            },
                            {
                              name: 'url',
                              title: 'URL',
                              type: 'string',
                              validation: (Rule) => Rule.required(),
                            },
                            {
                              name: 'description',
                              title: 'Description',
                              type: 'text',
                              rows: 2,
                            },
                            {
                              name: 'openInNewTab',
                              title: 'Open in New Tab',
                              type: 'boolean',
                              initialValue: false,
                            },
                          ],
                          preview: {
                            select: {
                              title: 'label',
                              subtitle: 'url',
                            },
                          },
                        },
                      ],
                    },
                    {
                      name: 'featuredImage',
                      title: 'Featured Image',
                      type: 'image',
                      description: 'Optional featured image for this column',
                      options: {
                        hotspot: true,
                      },
                    },
                  ],
                  preview: {
                    select: {
                      title: 'title',
                      media: 'featuredImage',
                    },
                  },
                },
              ],
            },
            {
              name: 'simpleDropdown',
              title: 'Simple Dropdown Links',
              type: 'array',
              hidden: ({ parent }) => parent?.hasMegaMenu,
              description: 'Simple dropdown menu (used if mega menu is disabled)',
              of: [
                {
                  type: 'object',
                  name: 'dropdownLink',
                  fields: [
                    {
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'url',
                      title: 'URL',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'openInNewTab',
                      title: 'Open in New Tab',
                      type: 'boolean',
                      initialValue: false,
                    },
                  ],
                  preview: {
                    select: {
                      title: 'label',
                      subtitle: 'url',
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'url',
              hasMegaMenu: 'hasMegaMenu',
            },
            prepare({ title, subtitle, hasMegaMenu }) {
              return {
                title,
                subtitle: hasMegaMenu ? '📋 Mega Menu' : subtitle,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      identifier: 'identifier',
    },
    prepare({ title, identifier }) {
      return {
        title: title,
        subtitle: identifier ? `ID: ${identifier}` : undefined,
      }
    },
  },
})
