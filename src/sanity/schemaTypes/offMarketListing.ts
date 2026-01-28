import { defineType, defineField } from 'sanity'

export const offMarketListing = defineType({
  name: 'offMarketListing',
  title: 'Off Market Listing',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info', default: true },
    { name: 'location', title: 'Location' },
    { name: 'details', title: 'Property Details' },
    { name: 'features', title: 'Features' },
    { name: 'media', title: 'Photos & Media' },
    { name: 'agent', title: 'Agent Info' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Listing Title',
      type: 'string',
      description: 'Internal title for this listing (e.g., "123 Main St - Off Market")',
      group: 'basic',
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
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'Active' },
          { title: 'Pending', value: 'Pending' },
          { title: 'Closed', value: 'Closed' },
          { title: 'Coming Soon', value: 'Coming Soon' },
        ],
        layout: 'radio',
      },
      initialValue: 'Active',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'listPrice',
      title: 'List Price',
      type: 'number',
      description: 'Listing price in USD',
      group: 'basic',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'soldPrice',
      title: 'Sold Price',
      type: 'number',
      description: 'Final sale price (if sold)',
      group: 'basic',
      hidden: ({ parent }) => parent?.status !== 'Closed',
    }),
    defineField({
      name: 'propertyType',
      title: 'Property Type',
      type: 'string',
      options: {
        list: [
          { title: 'Single Family Residence', value: 'Single Family Residence' },
          { title: 'Condominium', value: 'Condominium' },
          { title: 'Townhouse', value: 'Townhouse' },
          { title: 'Multi-Family', value: 'Multi-Family' },
          { title: 'Land', value: 'Land' },
          { title: 'Commercial', value: 'Commercial' },
          { title: 'Other', value: 'Other' },
        ],
      },
      group: 'basic',
    }),
    defineField({
      name: 'listingDate',
      title: 'Listing Date',
      type: 'date',
      group: 'basic',
    }),
    defineField({
      name: 'soldDate',
      title: 'Sold Date',
      type: 'date',
      group: 'basic',
      hidden: ({ parent }) => parent?.status !== 'Closed',
    }),

    // Location
    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
      initialValue: 'CO',
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'zipCode',
      title: 'ZIP Code',
      type: 'string',
      group: 'location',
    }),
    defineField({
      name: 'subdivisionName',
      title: 'Subdivision / Neighborhood',
      type: 'string',
      group: 'location',
    }),
    defineField({
      name: 'mlsAreaMinor',
      title: 'MLS Area Minor',
      type: 'string',
      description: 'MLS neighborhood designation',
      group: 'location',
    }),
    defineField({
      name: 'coordinates',
      title: 'Location Coordinates',
      type: 'geopoint',
      description: 'Property location for map display',
      group: 'location',
    }),

    // Property Details
    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'bathroomsFull',
      title: 'Full Bathrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'bathroomsThreeQuarter',
      title: '3/4 Bathrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'bathroomsHalf',
      title: 'Half Bathrooms',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'squareFeet',
      title: 'Square Feet',
      type: 'number',
      description: 'Living area in square feet',
      group: 'details',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'lotSize',
      title: 'Lot Size (Acres)',
      type: 'number',
      description: 'Lot size in acres',
      group: 'details',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'yearBuilt',
      title: 'Year Built',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.min(1800).max(new Date().getFullYear() + 5),
    }),
    defineField({
      name: 'description',
      title: 'Property Description',
      type: 'text',
      rows: 6,
      group: 'details',
    }),
    defineField({
      name: 'furnished',
      title: 'Furnished',
      type: 'string',
      options: {
        list: [
          { title: 'Unfurnished', value: 'Unfurnished' },
          { title: 'Partially Furnished', value: 'Partially Furnished' },
          { title: 'Fully Furnished', value: 'Fully Furnished' },
        ],
      },
      group: 'details',
    }),

    // Features
    defineField({
      name: 'fireplaceYn',
      title: 'Has Fireplace',
      type: 'boolean',
      initialValue: false,
      group: 'features',
    }),
    defineField({
      name: 'fireplaceTotal',
      title: 'Number of Fireplaces',
      type: 'number',
      group: 'features',
      hidden: ({ parent }) => !parent?.fireplaceYn,
    }),
    defineField({
      name: 'fireplaceFeatures',
      title: 'Fireplace Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
      hidden: ({ parent }) => !parent?.fireplaceYn,
    }),
    defineField({
      name: 'cooling',
      title: 'Cooling',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
    }),
    defineField({
      name: 'heating',
      title: 'Heating',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
    }),
    defineField({
      name: 'laundryFeatures',
      title: 'Laundry Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
    }),
    defineField({
      name: 'attachedGarageYn',
      title: 'Attached Garage',
      type: 'boolean',
      initialValue: false,
      group: 'features',
    }),
    defineField({
      name: 'parkingFeatures',
      title: 'Parking Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
    }),
    defineField({
      name: 'associationAmenities',
      title: 'Association Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'features',
    }),

    // Photos & Media
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      group: 'media',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Property Photos',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      group: 'media',
    }),
    defineField({
      name: 'virtualTourUrl',
      title: 'Virtual Tour URL',
      type: 'url',
      description: 'Matterport or other virtual tour link',
      group: 'media',
    }),

    // Agent Info
    defineField({
      name: 'agentName',
      title: 'Agent Name',
      type: 'string',
      group: 'agent',
    }),
    defineField({
      name: 'agentEmail',
      title: 'Agent Email',
      type: 'string',
      group: 'agent',
    }),
    defineField({
      name: 'agentPhone',
      title: 'Agent Phone',
      type: 'string',
      group: 'agent',
    }),
    defineField({
      name: 'officeName',
      title: 'Office Name',
      type: 'string',
      group: 'agent',
    }),

    // Settings
    defineField({
      name: 'requiresRegistration',
      title: 'Requires Registration to View',
      type: 'boolean',
      description: 'When enabled, users must register/login to view full property details',
      initialValue: true,
      group: 'settings',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Listing',
      type: 'boolean',
      description: 'Mark this as a featured off-market listing',
      initialValue: false,
      group: 'settings',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'settings',
    }),
  ],
  preview: {
    select: {
      title: 'address',
      subtitle: 'city',
      media: 'featuredImage',
      price: 'listPrice',
      status: 'status',
    },
    prepare(selection) {
      const { title, subtitle, media, price, status } = selection
      const formattedPrice = price
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(price)
        : 'Price TBD'
      return {
        title: title || 'Untitled Listing',
        subtitle: `${subtitle || ''} • ${formattedPrice} • ${status || 'Active'}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Price, High to Low',
      name: 'priceDesc',
      by: [{ field: 'listPrice', direction: 'desc' }],
    },
    {
      title: 'Price, Low to High',
      name: 'priceAsc',
      by: [{ field: 'listPrice', direction: 'asc' }],
    },
    {
      title: 'Newest First',
      name: 'listingDateDesc',
      by: [{ field: 'listingDate', direction: 'desc' }],
    },
  ],
})
