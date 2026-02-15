import { client } from '@/sanity/client';

interface SiteSettings {
  template?: 'classic' | 'luxury' | 'modern' | 'custom-one' | 'rcsothebys-custom';
  listingsPerRow?: 2 | 3;
  title?: string;
  description?: string;
  siteUrl?: string;
  branding?: {
    logo?: any;
    logoAlt?: string;
    favicon?: any;
    appleTouchIcon?: any;
  };
  apiKeys?: {
    censusApiKey?: string;
    youtubeApiKey?: string;
    youtubeChannelId?: string;
    googleMapsApiKey?: string;
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    googleAdsConversionId?: string;
    googleAdsConversionLabel?: string;
    facebookPixelId?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  seo?: {
    defaultMetaImage?: any;
    keywords?: string[];
  };
  footer?: {
    portraitImage?: any;
    taglineImage?: any;
    brokerageLogo?: any;
  };
  teamSync?: {
    enabled?: boolean;
    offices?: Array<{ officeName: string; officeId: string }>;
    defaultOrder?: number;
  };
}

const SETTINGS_QUERY = `*[_type == "settings" && _id == "settings"][0]{
  template,
  listingsPerRow,
  title,
  description,
  siteUrl,
  apiKeys,
  socialMedia,
  contactInfo,
  seo,
  branding {
    logo {
      asset->
    },
    logoAlt,
    favicon {
      asset->
    },
    appleTouchIcon {
      asset->
    }
  },
  footer {
    portraitImage {
      asset->
    },
    taglineImage {
      asset->
    },
    brokerageLogo {
      asset->
    }
  },
  teamSync
}`;

/**
 * Fetches site settings from Sanity
 * Returns settings with API keys and configuration
 */
export async function getSettings(): Promise<SiteSettings | null> {
  try {
    const settings = await client.fetch<SiteSettings>(
      SETTINGS_QUERY,
      {},
      { next: { revalidate: 3600 } } // Cache for 1 hour (settings rarely change)
    );
    return settings || null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

/**
 * Gets the site template from Sanity settings
 * Priority: Sanity setting > NEXT_PUBLIC_SITE_TEMPLATE env var > 'classic'
 */
export async function getSiteTemplate(): Promise<'classic' | 'luxury' | 'modern' | 'custom-one' | 'rcsothebys-custom'> {
  const settings = await getSettings();
  const envTemplate = process.env.NEXT_PUBLIC_SITE_TEMPLATE as SiteSettings['template'];
  return settings?.template || envTemplate || 'classic';
}

/**
 * Gets Census API key from Sanity settings or environment variable
 * Priority: Sanity > Environment Variable
 */
export async function getCensusApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings?.apiKeys?.censusApiKey || process.env.CENSUS_API_KEY;
}

/**
 * Gets YouTube API credentials from Sanity settings or environment variables
 * Priority: Sanity > Environment Variables
 */
export async function getYouTubeCredentials(): Promise<{
  apiKey?: string;
  channelId?: string;
}> {
  const settings = await getSettings();
  return {
    apiKey: settings?.apiKeys?.youtubeApiKey || process.env.YOUTUBE_API_KEY,
    channelId: settings?.apiKeys?.youtubeChannelId || process.env.YOUTUBE_CHANNEL_ID,
  };
}

/**
 * Gets Google Maps API key from Sanity settings or environment variable
 * Priority: Sanity > Environment Variable
 */
export async function getGoogleMapsApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings?.apiKeys?.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

/**
 * Gets Google Analytics Measurement ID from Sanity settings or environment variable
 * Priority: Sanity > Environment Variable
 */
export async function getGoogleAnalyticsId(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings?.apiKeys?.googleAnalyticsId || process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
}

/**
 * Gets Google Tag Manager ID from Sanity settings or environment variable
 * Priority: Sanity > Environment Variable
 */
export async function getGoogleTagManagerId(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings?.apiKeys?.googleTagManagerId || process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
}

/**
 * Gets Google Ads conversion tracking credentials from Sanity settings or environment variables
 * Priority: Sanity > Environment Variables
 */
export async function getGoogleAdsCredentials(): Promise<{
  conversionId?: string;
  conversionLabel?: string;
}> {
  const settings = await getSettings();
  return {
    conversionId: settings?.apiKeys?.googleAdsConversionId || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
    conversionLabel: settings?.apiKeys?.googleAdsConversionLabel || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL,
  };
}

/**
 * Gets Facebook Pixel ID from Sanity settings or environment variable
 * Priority: Sanity > Environment Variable
 */
export async function getFacebookPixelId(): Promise<string | undefined> {
  const settings = await getSettings();
  return settings?.apiKeys?.facebookPixelId || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
}

/**
 * Gets branding assets (logo, favicon, apple touch icon) from Sanity settings
 * Returns branding configuration for site-wide use
 */
export async function getBranding(): Promise<{
  logo?: any;
  logoAlt?: string;
  favicon?: any;
  appleTouchIcon?: any;
} | null> {
  const settings = await getSettings();
  return settings?.branding || null;
}

export interface TeamSyncConfig {
  enabled: boolean;
  offices: Array<{ officeName: string; officeId: string }>;
  defaultOrder: number;
}

export async function getTeamSyncConfig(): Promise<TeamSyncConfig> {
  const settings = await getSettings();
  return {
    enabled: settings?.teamSync?.enabled ?? false,
    offices: settings?.teamSync?.offices ?? [],
    defaultOrder: settings?.teamSync?.defaultOrder ?? 100,
  };
}
