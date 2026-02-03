import { client } from '@/sanity/client';

interface HomepageData {
  title?: string;
  hero?: {
    title?: string;
    subtitle?: string;
    videoUrl?: string;
    videoFile?: any;
    fallbackImage?: any;
    showSearch?: boolean;
    showTitleSubtitle?: boolean;
  };
  teamSection?: {
    enabled?: boolean;
    title?: string;
    imagePosition?: 'left' | 'right';
    textAlign?: 'left' | 'right';
    featuredTeamMember?: {
      name?: string;
      slug?: { current: string };
      title?: string;
      bio?: string;
      mlsAgentId?: string;
      image?: any;
      email?: string;
      phone?: string;
      mobile?: string;
      office?: string;
      address?: string;
    };
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };
  accolades?: {
    enabled?: boolean;
    title?: string;
    backgroundImage?: any;
    items?: Array<{
      type: 'number' | 'numberWithPrefix' | 'image';
      value?: string;
      prefix?: string;
      image?: any;
      label?: string;
    }>;
  };
  featuredProperty?: {
    enabled?: boolean;
    mlsId?: string;
    title?: string;
    headline?: string;
    buttonText?: string;
  };
  featuredPropertiesCarousel?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    cities?: string[];
    limit?: number;
    buttonText?: string;
  };
  featuredCommunities?: {
    title?: string;
    showAll?: boolean;
    communities?: Array<{
      _id: string;
      title: string;
      slug: { current: string };
      status?: string;
      description?: string;
      featuredImage?: any;
    }>;
    limit?: number;
  };
  neighborhoodsSection?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
  };
  marketStatsSection?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    cities?: Array<{
      city: string;
      enabled: boolean;
    }>;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: any;
    keywords?: string[];
  };
}

const HOMEPAGE_QUERY = `*[_type == "homepage" && _id == "homepage"][0]{
  title,
  hero {
    title,
    subtitle,
    videoUrl,
    videoFile {
      asset-> {
        url
      }
    },
    fallbackImage {
      asset-> {
        _id,
        url
      }
    },
    showSearch,
    showTitleSubtitle
  },
  teamSection {
    enabled,
    title,
    imagePosition,
    textAlign,
    featuredTeamMember-> {
      name,
      slug,
      title,
      bio,
      mlsAgentId,
      image {
        asset-> {
          _id,
          url
        }
      },
      email,
      phone,
      mobile,
      office,
      address
    },
    primaryButtonText,
    primaryButtonLink,
    secondaryButtonText,
    secondaryButtonLink
  },
  accolades {
    enabled,
    title,
    backgroundImage {
      asset-> {
        _id,
        url
      }
    },
    items[] {
      type,
      value,
      prefix,
      image {
        asset-> {
          _id,
          url
        }
      },
      label
    }
  },
  featuredProperty {
    enabled,
    mlsId,
    title,
    headline,
    buttonText
  },
  featuredPropertiesCarousel {
    enabled,
    title,
    subtitle,
    cities,
    limit,
    buttonText
  },
  featuredCommunities {
    title,
    showAll,
    communities[]-> {
      _id,
      title,
      slug,
      status,
      description,
      featuredImage {
        asset-> {
          _id,
          url
        }
      }
    },
    limit
  },
  neighborhoodsSection {
    enabled,
    title,
    subtitle
  },
  marketStatsSection {
    enabled,
    title,
    subtitle,
    cities[] {
      city,
      enabled
    }
  },
  seo {
    metaTitle,
    metaDescription,
    metaImage {
      asset-> {
        _id,
        url
      }
    },
    keywords
  }
}`;

/**
 * Fetches homepage data from Sanity
 * Returns homepage configuration including hero section, featured communities, and SEO
 */
export async function getHomepageData(): Promise<HomepageData | null> {
  try {
    const homepage = await client.fetch<HomepageData>(
      HOMEPAGE_QUERY,
      {},
      { next: { revalidate: 60 } } // Cache for 1 minute
    );
    return homepage || null;
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return null;
  }
}

const ALL_COMMUNITIES_QUERY = `*[_type == "community" && status != "Sold Out"] | order(title asc) [0...$limit] {
  _id,
  title,
  slug,
  status,
  description,
  featuredImage {
    asset-> {
      _id,
      url
    }
  }
}`;

/**
 * Fetches all active communities from Sanity (for "show all" mode)
 */
export async function getAllCommunities(limit: number = 12) {
  try {
    const communities = await client.fetch(
      ALL_COMMUNITIES_QUERY,
      { limit },
      { next: { revalidate: 60 } }
    );
    return communities || [];
  } catch (error) {
    console.error('Error fetching all communities:', error);
    return [];
  }
}
