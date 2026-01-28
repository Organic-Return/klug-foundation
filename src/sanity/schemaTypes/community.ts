import { defineType, defineField } from 'sanity'

export const community = defineType({
  name: 'community',
  title: 'Community',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Community Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'communityType',
      title: 'Community Type',
      type: 'string',
      description: 'Select the type of community to configure MLS data filtering',
      options: {
        list: [
          { title: 'City', value: 'city' },
          { title: 'Neighborhood', value: 'neighborhood' },
          { title: 'Complex', value: 'complex' },
        ],
        layout: 'radio',
      },
      initialValue: 'city',
    }),
    defineField({
      name: 'mlsAreaMinor',
      title: 'MLS Neighborhood',
      type: 'string',
      description: 'Select the MLS area minor (neighborhood) to filter listings for this community. The dropdown options are loaded from your MLS listings database.',
      options: {
        // @ts-expect-error - Sanity supports async list but types don't reflect it
        list: async () => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/listing-options`);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.neighborhoods || []).map((name: string) => ({
              title: name,
              value: name,
            }));
          } catch (error) {
            console.error('Error fetching neighborhoods:', error);
            return [];
          }
        },
      },
      hidden: ({ parent }) => parent?.communityType !== 'neighborhood',
    }),
    defineField({
      name: 'subdivisionName',
      title: 'Complex / Subdivision',
      type: 'string',
      description: 'Select the subdivision/complex name to filter listings for this community. The dropdown options are loaded from your MLS listings database.',
      options: {
        // @ts-expect-error - Sanity supports async list but types don't reflect it
        list: async () => {
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/listing-options`);
            if (!response.ok) return [];
            const data = await response.json();
            return (data.complexes || []).map((name: string) => ({
              title: name,
              value: name,
            }));
          } catch (error) {
            console.error('Error fetching complexes:', error);
            return [];
          }
        },
      },
      hidden: ({ parent }) => parent?.communityType !== 'complex',
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of the community',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coordinates',
      title: 'Location Coordinates',
      type: 'geopoint',
      description: 'Location coordinates for map display',
    }),
    defineField({
      name: 'demographics',
      title: 'Demographics',
      type: 'object',
      description: 'Demographic data for the community area (auto-populated from Census API)',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'population',
          title: 'Total Population',
          type: 'number',
        },
        {
          name: 'households',
          title: 'Number of Households',
          type: 'number',
        },
        {
          name: 'medianAge',
          title: 'Median Age',
          type: 'number',
        },
        {
          name: 'medianIncome',
          title: 'Median Household Income',
          type: 'number',
        },
        {
          name: 'bachelorsDegreePercent',
          title: 'Bachelor\'s Degree or Higher (%)',
          type: 'number',
        },
        {
          name: 'ageDistribution',
          title: 'Age Distribution',
          type: 'object',
          fields: [
            {
              name: 'under18',
              title: 'Under 18 (%)',
              type: 'number',
            },
            {
              name: 'age18to34',
              title: '18-34 (%)',
              type: 'number',
            },
            {
              name: 'age35to64',
              title: '35-64 (%)',
              type: 'number',
            },
            {
              name: 'age65plus',
              title: '65+ (%)',
              type: 'number',
            },
          ],
        },
        {
          name: 'housingUnits',
          title: 'Total Housing Units',
          type: 'number',
        },
        {
          name: 'occupancyStatus',
          title: 'Housing Occupancy Status',
          type: 'object',
          fields: [
            {
              name: 'totalUnits',
              title: 'Total Housing Units',
              type: 'number',
            },
            {
              name: 'occupied',
              title: 'Occupied Units',
              type: 'number',
            },
            {
              name: 'vacant',
              title: 'Vacant Units',
              type: 'number',
            },
            {
              name: 'occupancyRate',
              title: 'Occupancy Rate (%)',
              type: 'number',
            },
          ],
        },
        {
          name: 'tenure',
          title: 'Housing Tenure',
          type: 'object',
          fields: [
            {
              name: 'ownerOccupied',
              title: 'Owner-Occupied Units',
              type: 'number',
            },
            {
              name: 'renterOccupied',
              title: 'Renter-Occupied Units',
              type: 'number',
            },
            {
              name: 'ownerOccupiedPercent',
              title: 'Owner-Occupied (%)',
              type: 'number',
            },
          ],
        },
        {
          name: 'medianHomeValue',
          title: 'Median Home Value',
          type: 'number',
        },
        {
          name: 'medianGrossRent',
          title: 'Median Gross Rent',
          type: 'number',
        },
        {
          name: 'elevation',
          title: 'Elevation',
          type: 'number',
          description: 'Elevation in feet above sea level',
        },
        {
          name: 'lastUpdated',
          title: 'Last Updated',
          type: 'datetime',
          description: 'When this demographic data was last fetched',
        },
      ],
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Price',
          type: 'number',
        },
        {
          name: 'max',
          title: 'Maximum Price',
          type: 'number',
        },
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of community amenities',
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'body',
      title: 'Detailed Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'}
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'}
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url'
                  }
                ]
              }
            ]
          }
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility',
              options: {
                isHighlighted: true,
              },
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
        {
          type: 'mux.video',
          title: 'Video',
        },
        {
          type: 'code',
          title: 'Code Block',
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      description: 'SEO metadata for this community',
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
          validation: (Rule) => Rule.max(60).warning('Titles over 60 characters may be truncated in search results'),
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'SEO description (recommended: 150-160 characters)',
          validation: (Rule) => Rule.max(160).warning('Descriptions over 160 characters may be truncated in search results'),
        },
        {
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
          description: 'Custom image for social sharing (recommended: 1200x630px). If not set, the featured image will be used.',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'keywords',
          title: 'Focus Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Keywords for SEO (optional)',
          options: {
            layout: 'tags',
          },
        },
        {
          name: 'noIndex',
          title: 'Hide from Search Engines',
          type: 'boolean',
          description: 'Prevent this page from being indexed by search engines',
          initialValue: false,
        },
      ],
    }),
    defineField({
      name: 'marketInsightsCity',
      title: 'Market Insights City',
      type: 'string',
      description: 'Select the city to display market insights for this community. This should match a city name configured in your MLS settings.',
    }),
    defineField({
      name: 'neighborhoods',
      title: 'Neighborhoods',
      type: 'array',
      description: 'Add neighborhoods within this community that visitors can explore',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Neighborhood Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'slug',
              title: 'Slug',
              type: 'slug',
              options: {
                source: 'name',
                maxLength: 96,
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Short Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'image',
              title: 'Neighborhood Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            },
          ],
          preview: {
            select: {
              title: 'name',
              media: 'image',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'nearbySchools',
      title: 'Nearby Schools',
      type: 'array',
      description: 'Add schools near this community',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'School Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'type',
              title: 'School Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Elementary', value: 'elementary' },
                  { title: 'Middle School', value: 'middle' },
                  { title: 'High School', value: 'high' },
                  { title: 'K-12', value: 'k12' },
                  { title: 'Private', value: 'private' },
                  { title: 'Charter', value: 'charter' },
                ],
              },
            },
            {
              name: 'rating',
              title: 'Rating (1-10)',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(10),
            },
            {
              name: 'distance',
              title: 'Distance',
              type: 'string',
              description: 'e.g., "0.5 miles", "2 km"',
            },
            {
              name: 'address',
              title: 'Address',
              type: 'string',
            },
            {
              name: 'website',
              title: 'Website URL',
              type: 'url',
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'type',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'nearbyAttractions',
      title: 'Nearby Attractions',
      type: 'array',
      description: 'Add attractions and points of interest near this community',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Attraction Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'category',
              title: 'Category',
              type: 'string',
              options: {
                list: [
                  { title: 'Restaurant', value: 'restaurant' },
                  { title: 'Shopping', value: 'shopping' },
                  { title: 'Park', value: 'park' },
                  { title: 'Entertainment', value: 'entertainment' },
                  { title: 'Fitness', value: 'fitness' },
                  { title: 'Healthcare', value: 'healthcare' },
                  { title: 'Grocery', value: 'grocery' },
                  { title: 'Coffee Shop', value: 'coffee' },
                  { title: 'Museum', value: 'museum' },
                  { title: 'Outdoor Recreation', value: 'outdoor' },
                  { title: 'Other', value: 'other' },
                ],
              },
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
            {
              name: 'distance',
              title: 'Distance',
              type: 'string',
              description: 'e.g., "0.5 miles", "2 km"',
            },
            {
              name: 'address',
              title: 'Address',
              type: 'string',
            },
            {
              name: 'website',
              title: 'Website URL',
              type: 'url',
            },
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'category',
              media: 'image',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'localHighlights',
      title: 'Local Highlights Section',
      type: 'object',
      description: 'Customize the titles and subtitles for the Local Highlights section',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'sectionTitle',
          title: 'Section Title',
          type: 'string',
          description: 'Main section title (default: "Local Highlights")',
        },
        {
          name: 'sectionSubtitle',
          title: 'Section Subtitle',
          type: 'text',
          rows: 2,
          description: 'Main section description',
        },
        {
          name: 'schoolsTitle',
          title: 'Schools Section Title',
          type: 'string',
          description: 'Title for schools subsection (default: "Schools")',
        },
        {
          name: 'schoolsSubtitle',
          title: 'Schools Section Subtitle',
          type: 'string',
          description: 'Subtitle for schools subsection (default: "Nearby educational institutions")',
        },
        {
          name: 'attractionsTitle',
          title: 'Points of Interest Title',
          type: 'string',
          description: 'Title for attractions subsection (default: "Points of Interest")',
        },
        {
          name: 'attractionsSubtitle',
          title: 'Points of Interest Subtitle',
          type: 'string',
          description: 'Subtitle for attractions subsection (default: "Dining, shopping, and entertainment nearby")',
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured Community',
      type: 'boolean',
      description: 'Mark this community as featured',
      initialValue: false,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Coming Soon', value: 'coming-soon'},
          {title: 'Sold Out', value: 'sold-out'},
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage',
      status: 'status',
      communityType: 'communityType',
    },
    prepare(selection) {
      const {title, media, status, communityType} = selection
      const typeLabels: Record<string, string> = {
        city: 'City',
        neighborhood: 'Neighborhood',
        complex: 'Complex',
      }
      const typeLabel = communityType ? typeLabels[communityType] || communityType : 'City'
      return {
        title: title,
        subtitle: `${typeLabel} • ${status || 'active'}`,
        media: media,
      }
    },
  },
})
