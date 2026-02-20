import { defineType, defineField } from 'sanity'

export const openHousesPage = defineType({
  name: 'openHousesPage',
  title: 'Open Houses Page',
  type: 'document',
  fields: [
    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Main headline for the open houses page',
      initialValue: 'Open Houses',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 2,
      description: 'Subtitle displayed below the hero title',
      initialValue: 'Visit our upcoming open houses and find your next home',
    }),

    // City Filter
    defineField({
      name: 'cities',
      title: 'Cities to Display',
      type: 'array',
      description: 'Select which cities to show open houses for. If none are selected, all open houses will be shown. Drag to reorder.',
      of: [
        {
          type: 'object',
          name: 'openHouseCity',
          fields: [
            {
              name: 'city',
              title: 'City',
              type: 'string',
              options: {
                list: [
                  // PacMLS / Tri-Cities (WA)
                  { title: 'Benton City', value: 'Benton City' },
                  { title: 'Burbank', value: 'Burbank' },
                  { title: 'Clarkston', value: 'Clarkston' },
                  { title: 'Colfax', value: 'Colfax' },
                  { title: 'College Place', value: 'College Place' },
                  { title: 'Connell', value: 'Connell' },
                  { title: 'Finley', value: 'Finley' },
                  { title: 'Grandview', value: 'Grandview' },
                  { title: 'Kennewick', value: 'Kennewick' },
                  { title: 'Mesa', value: 'Mesa' },
                  { title: 'Moses Lake', value: 'Moses Lake' },
                  { title: 'Othello', value: 'Othello' },
                  { title: 'Palouse', value: 'Palouse' },
                  { title: 'Pasco', value: 'Pasco' },
                  { title: 'Plymouth', value: 'Plymouth' },
                  { title: 'Prosser', value: 'Prosser' },
                  { title: 'Pullman', value: 'Pullman' },
                  { title: 'Richland', value: 'Richland' },
                  { title: 'Sunnyside', value: 'Sunnyside' },
                  { title: 'Walla Walla', value: 'Walla Walla' },
                  { title: 'West Richland', value: 'West Richland' },
                  { title: 'Yakima', value: 'Yakima' },
                  { title: 'Zillah', value: 'Zillah' },
                  // Aspen / Roaring Fork Valley (CO)
                  { title: 'Aspen', value: 'Aspen' },
                  { title: 'Basalt', value: 'Basalt' },
                  { title: 'Carbondale', value: 'Carbondale' },
                  { title: 'El Jebel', value: 'El Jebel' },
                  { title: 'Glenwood Springs', value: 'Glenwood Springs' },
                  { title: 'Marble', value: 'Marble' },
                  { title: 'Meredith', value: 'Meredith' },
                  { title: 'New Castle', value: 'New Castle' },
                  { title: 'Parachute', value: 'Parachute' },
                  { title: 'Redstone', value: 'Redstone' },
                  { title: 'Rifle', value: 'Rifle' },
                  { title: 'Silt', value: 'Silt' },
                  { title: 'Snowmass', value: 'Snowmass' },
                  { title: 'Snowmass Village', value: 'Snowmass Village' },
                  { title: 'Thomasville', value: 'Thomasville' },
                  { title: 'Woody Creek', value: 'Woody Creek' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'enabled',
              title: 'Show this city',
              type: 'boolean',
              initialValue: true,
            },
          ],
          preview: {
            select: {
              title: 'city',
              enabled: 'enabled',
            },
            prepare({ title, enabled }) {
              return {
                title: title || 'Unknown City',
                subtitle: enabled ? '✅ Shown' : '❌ Hidden',
              };
            },
          },
        },
      ],
    }),

    // SEO
    defineField({
      name: 'seo',
      title: 'SEO Settings',
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
          description: 'Override the default page title for search engines',
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Description shown in search engine results',
        },
      ],
    }),
  ],
})
