import { defineType, defineField } from 'sanity';

// Main property types from database (property_type column)
const PROPERTY_TYPES = [
  'Commercial Land',
  'Commercial Lease',
  'Commercial Sale',
  'Fractional',
  'RES Vacant Land',
  'Residential',
  'Residential Lease',
];

// Property subtypes from database (property_sub_type column)
const PROPERTY_SUB_TYPES = [
  'Agricultural',
  'Agriculture',
  'Business with Real Estate',
  'Business with/RE',
  'Commercial',
  'Commercial Land',
  'Condominium',
  'Development',
  'Duplex',
  'Half Duplex',
  'Leasehold',
  'Mobile Home',
  'Multi-Family Lot',
  'Other',
  'Residential Income',
  'Seasonal & Remote',
  'Single Family Lot',
  'Single Family Residence',
  'Townhouse',
];

// Cities from database
const CITIES = [
  'Aspen',
  'Basalt',
  'Carbondale',
  'El Jebel',
  'Glenwood Springs',
  'Marble',
  'Meredith',
  'New Castle',
  'Parachute',
  'Redstone',
  'Rifle',
  'Silt',
  'Snowmass',
  'Snowmass Village',
  'Thomasville',
  'Woody Creek',
];

// Statuses from database
const STATUSES = [
  'Active',
  'Active Under Contract',
  'Closed',
  'Pending',
];

export const mlsConfiguration = defineType({
  name: 'mlsConfiguration',
  title: 'MLS Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Configuration Name',
      type: 'string',
      initialValue: 'MLS Settings',
      readOnly: true,
    }),
    defineField({
      name: 'excludedPropertyTypes',
      title: 'Excluded Property Types',
      description: 'Check the main property types you want to HIDE from the listings page (e.g., Commercial Lease, Residential Lease)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'propertyType',
              title: 'Property Type',
              type: 'string',
              options: {
                list: PROPERTY_TYPES.map((type) => ({ title: type, value: type })),
              },
            }),
            defineField({
              name: 'excluded',
              title: 'Exclude from listings',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'propertyType',
              excluded: 'excluded',
            },
            prepare({ title, excluded }) {
              return {
                title: title || 'Unknown Type',
                subtitle: excluded ? '❌ Hidden' : '✅ Visible',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'excludedPropertySubTypes',
      title: 'Excluded Property Subtypes',
      description: 'Check the property subtypes you want to HIDE from the listings page (e.g., Commercial, Mobile Home)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'propertySubType',
              title: 'Property Subtype',
              type: 'string',
              options: {
                list: PROPERTY_SUB_TYPES.map((type) => ({ title: type, value: type })),
              },
            }),
            defineField({
              name: 'excluded',
              title: 'Exclude from listings',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'propertySubType',
              excluded: 'excluded',
            },
            prepare({ title, excluded }) {
              return {
                title: title || 'Unknown Subtype',
                subtitle: excluded ? '❌ Hidden' : '✅ Visible',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'allowedCities',
      title: 'Allowed Cities',
      description: 'Check the cities you want to SHOW on the listings page. If none are selected, all cities will be shown.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'city',
              title: 'City',
              type: 'string',
              options: {
                list: CITIES.map((city) => ({ title: city, value: city })),
              },
            }),
            defineField({
              name: 'allowed',
              title: 'Show in listings',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'city',
              allowed: 'allowed',
            },
            prepare({ title, allowed }) {
              return {
                title: title || 'Unknown City',
                subtitle: allowed ? '✅ Shown' : '❌ Hidden',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'excludedStatuses',
      title: 'Excluded Statuses',
      description: 'Check the statuses you want to HIDE from the listings page',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: STATUSES.map((status) => ({ title: status, value: status })),
              },
            }),
            defineField({
              name: 'excluded',
              title: 'Exclude from listings',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'status',
              excluded: 'excluded',
            },
            prepare({ title, excluded }) {
              return {
                title: title || 'Unknown Status',
                subtitle: excluded ? '❌ Hidden' : '✅ Visible',
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'MLS Configuration',
        subtitle: 'Property type, subtype, and city filters',
      };
    },
  },
});
