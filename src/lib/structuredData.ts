interface OrganizationData {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  address?: string;
  email?: string;
  phone?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface PersonData {
  name?: string;
  jobTitle?: string;
  email?: string;
  telephone?: string;
  image?: string;
  address?: string;
}

interface WebSiteData {
  name?: string;
  description?: string;
  url?: string;
}

/**
 * Generates Schema.org Organization structured data
 */
export function generateOrganizationSchema(data: OrganizationData) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: data.name,
    description: data.description,
    url: data.url,
  };

  if (data.logo) {
    schema.logo = {
      '@type': 'ImageObject',
      url: data.logo,
    };
  }

  if (data.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: data.address,
    };
  }

  if (data.email) {
    schema.email = data.email;
  }

  if (data.phone) {
    schema.telephone = data.phone;
  }

  // Add social media profiles
  const sameAs: string[] = [];
  if (data.socialMedia) {
    if (data.socialMedia.facebook) sameAs.push(data.socialMedia.facebook);
    if (data.socialMedia.instagram) sameAs.push(data.socialMedia.instagram);
    if (data.socialMedia.twitter) sameAs.push(data.socialMedia.twitter);
    if (data.socialMedia.linkedin) sameAs.push(data.socialMedia.linkedin);
    if (data.socialMedia.youtube) sameAs.push(data.socialMedia.youtube);
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

/**
 * Generates Schema.org Person structured data for team members
 */
export function generatePersonSchema(data: PersonData, organizationName?: string) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
  };

  if (data.jobTitle) {
    schema.jobTitle = data.jobTitle;
  }

  if (data.email) {
    schema.email = data.email;
  }

  if (data.telephone) {
    schema.telephone = data.telephone;
  }

  if (data.image) {
    schema.image = {
      '@type': 'ImageObject',
      url: data.image,
    };
  }

  if (data.address) {
    schema.workLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.address,
      },
    };
  }

  if (organizationName) {
    schema.worksFor = {
      '@type': 'RealEstateAgent',
      name: organizationName,
    };
  }

  return schema;
}

/**
 * Generates Schema.org WebSite structured data with SearchAction
 */
export function generateWebSiteSchema(data: WebSiteData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    description: data.description,
    url: data.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${data.url}/search?location={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates FAQPage structured data (useful for AI)
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates Service structured data for real estate services
 */
export function generateServiceSchema(data: OrganizationData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Real Estate Services',
    provider: {
      '@type': 'RealEstateAgent',
      name: data.name,
      url: data.url,
    },
    areaServed: {
      '@type': 'Place',
      name: 'United States',
    },
    description: data.description,
  };
}

/**
 * Generates LocalBusiness schema (useful for AI and local SEO)
 */
export function generateLocalBusinessSchema(data: OrganizationData) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    name: data.name,
    description: data.description,
    url: data.url,
    '@id': `${data.url}#organization`,
  };

  if (data.logo) {
    schema.logo = data.logo;
    schema.image = data.logo;
  }

  if (data.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: data.address,
    };
  }

  if (data.email) {
    schema.email = data.email;
  }

  if (data.phone) {
    schema.telephone = data.phone;
  }

  // Add business hours (can be customized)
  schema.openingHoursSpecification = [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ];

  return schema;
}

/**
 * Generates ProfessionalService schema for real estate services
 */
export function generateProfessionalServiceSchema(data: OrganizationData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: data.name,
    description: data.description || 'Professional Real Estate Services',
    url: data.url,
    priceRange: '$$',
    serviceType: [
      'Real Estate Sales',
      'Property Management',
      'Real Estate Consulting',
      'Buyer Representation',
      'Seller Representation',
    ],
  };
}

/**
 * Generates AboutPage schema (AI-friendly)
 */
export function generateAboutPageSchema(data: OrganizationData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'RealEstateAgent',
      name: data.name,
      description: data.description,
      url: data.url,
    },
  };
}

/**
 * Generates aggregated schema for the homepage with AI optimization
 */
export function generateHomepageSchemas(
  organizationData: OrganizationData,
  websiteData: WebSiteData,
  teamMember?: PersonData
) {
  const schemas = [
    generateOrganizationSchema(organizationData),
    generateWebSiteSchema(websiteData),
    generateServiceSchema(organizationData),
    generateLocalBusinessSchema(organizationData),
    generateProfessionalServiceSchema(organizationData),
  ];

  if (teamMember) {
    schemas.push(generatePersonSchema(teamMember, organizationData.name));
  }

  return schemas;
}

/**
 * Office address used when Sanity settings carry no street address. Google's
 * LocalBusiness validator rejects an address without streetAddress, so pages
 * that emit a RealEstateAgent entity always include the full office address.
 */
export const OFFICE_ADDRESS = {
  street: '415 East Hyman Avenue',
  locality: 'Aspen',
  region: 'CO',
  postalCode: '81611',
} as const;

/**
 * The brand as a business name. Sanity's site title is an SEO title such as
 * "Aspen Real Estate Agent | Chris Klug Properties"; the brand is its last
 * segment.
 */
export function brandName(title?: string | null): string {
  const parts = (title || '').split('|').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Chris Klug Properties';
}

/**
 * RealEstateAgent + LocalBusiness entity for a specific page (contact, sold),
 * sharing the homepage organization's @id so search engines treat it as the
 * same business rather than a second one.
 */
export function generateOfficeSchema(opts: {
  baseUrl: string;
  pageUrl: string;
  name?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    // Same @id as the homepage organization, whichever way the base URL is
    // configured (Sanity's siteUrl carries a trailing slash, the env var not).
    '@id': `${opts.baseUrl.replace(/\/+$/, '')}#organization`,
    name: brandName(opts.name),
    url: opts.pageUrl,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.phone ? { telephone: opts.phone } : {}),
    ...(opts.email ? { email: opts.email } : {}),
    priceRange: '$$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: opts.address || OFFICE_ADDRESS.street,
      addressLocality: OFFICE_ADDRESS.locality,
      addressRegion: OFFICE_ADDRESS.region,
      postalCode: OFFICE_ADDRESS.postalCode,
      addressCountry: 'US',
    },
  };
}
