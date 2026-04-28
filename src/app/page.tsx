import { Metadata } from 'next';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData, getAllCommunities } from '@/lib/homepage';
import { getSettings, getBranding } from '@/lib/settings';
import { getNewestHighPricedByCities, getNewestHighPricedByCity, getListingsByAgentId } from '@/lib/listings';
import StructuredData from '@/components/StructuredData';
import HomepageContent from '@/components/HomepageContent';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

export async function generateMetadata(): Promise<Metadata> {
  const [homepage, settings, branding] = await Promise.all([
    getHomepageData(),
    getSettings(),
    getBranding(),
  ]);

  const seo = homepage?.seo;
  const siteTitle = settings?.title || 'Real Estate';
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // Pick OG image: explicit SEO meta image > homepage hero fallback > branding logo
  const ogImageUrl = seo?.metaImage?.asset?.url
    ? urlFor(seo.metaImage).width(1200).height(630).fit('crop').url()
    : homepage?.hero?.fallbackImage?.asset?.url
      ? urlFor(homepage.hero.fallbackImage).width(1200).height(630).fit('crop').url()
      : branding?.logo?.asset?.url
        ? urlFor(branding.logo).width(1200).url()
        : undefined;
  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 1200, height: 630, alt: siteTitle }]
    : undefined;

  return {
    title: seo?.metaTitle || siteTitle,
    description: seo?.metaDescription || settings?.description,
    keywords: seo?.keywords,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: seo?.metaTitle || siteTitle,
      description: seo?.metaDescription || settings?.description,
      url: baseUrl,
      siteName: siteTitle,
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      title: seo?.metaTitle || siteTitle,
      description: seo?.metaDescription || settings?.description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function Home() {
  const [homepage, settings, branding] = await Promise.all([
    getHomepageData(),
    getSettings(),
    getBranding(),
  ]);

  const hero = homepage?.hero;
  const teamSection = homepage?.teamSection;
  const accolades = homepage?.accolades;
  const featuredProperty = homepage?.featuredProperty;
  const featuredCommunitiesConfig = homepage?.featuredCommunities;

  // Auto-pull all of Chris Klug's active listings for the featured property
  // rotator. Falls back to the CMS-set mlsId if the lookup fails.
  let autoFeaturedMlsIds: string[] = [];
  try {
    const chris = await client.fetch<{ mlsAgentId?: string; name?: string } | null>(
      `*[_type == "teamMember" && (slug.current == "chris-klug" || lower(name) == "chris klug") && inactive != true][0]{ mlsAgentId, name }`,
      {},
      { next: { revalidate: 300 } }
    );
    const chrisMlsId = chris?.mlsAgentId || '3837';
    const chrisListings = await getListingsByAgentId(chrisMlsId, undefined, chris?.name || 'Chris Klug');
    autoFeaturedMlsIds = chrisListings.activeListings
      .map((l) => l.mls_number)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    console.error('Featured property auto-pull failed:', err);
  }

  // Get video URL (either from Mux/uploaded file or external URL)
  const videoUrl = hero?.videoFile?.asset?.url || hero?.videoUrl;
  const fallbackImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1920).url()
    : undefined;

  // Build hero videos array (primary + additional)
  const heroVideos: Array<{ videoUrl?: string; posterUrl?: string }> = [];
  if (videoUrl || fallbackImageUrl) {
    heroVideos.push({ videoUrl, posterUrl: fallbackImageUrl });
  }
  if (hero?.additionalVideos) {
    for (const v of hero.additionalVideos) {
      const url = v.videoFile?.asset?.url || v.videoUrl;
      const poster = v.poster?.asset?.url
        ? urlFor(v.poster).width(1920).url()
        : undefined;
      if (url || poster) {
        heroVideos.push({ videoUrl: url, posterUrl: poster });
      }
    }
  }

  // Resolve communities: use showAll query or referenced communities
  const rawCommunities = featuredCommunitiesConfig?.showAll
    ? await getAllCommunities(featuredCommunitiesConfig?.limit || 12)
    : featuredCommunitiesConfig?.communities || [];

  const processedCommunities = rawCommunities.map((c: any) => ({
    _id: c._id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    imageUrl: c.featuredImage?.asset?.url
      ? urlFor(c.featuredImage).width(800).height(1067).url()
      : undefined,
  }));

  // Pre-fetch hero properties server-side for rcsothebys template (no loading flash)
  let heroProperties: any[] | undefined;
  if (settings?.template === 'rcsothebys-custom') {
    const heroCities = homepage?.featuredPropertiesCarousel?.cities;
    const heroLimit = 10;
    const heroOpts = { officeName: 'Retter', minPrice: 950000, sortBy: 'price' as const };
    try {
      heroProperties = heroCities && heroCities.length > 1
        ? await getNewestHighPricedByCities(heroCities, heroLimit, heroOpts)
        : await getNewestHighPricedByCity(heroCities?.[0] || 'Kennewick', heroLimit, heroOpts);
    } catch (e) {
      console.error('Error pre-fetching hero properties:', e);
    }
  }

  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // Logo URL for schema (square preferred for logo, full for image)
  const orgLogoUrl = branding?.logo?.asset?.url
    ? urlFor(branding.logo).width(600).url()
    : undefined;

  // Roaring Fork Valley service area — used for areaServed in LocalBusiness schema
  const areaServedCities = [
    'Aspen',
    'Snowmass Village',
    'Snowmass',
    'Basalt',
    'Carbondale',
    'El Jebel',
    'Woody Creek',
    'Old Snowmass',
    'Glenwood Springs',
    'Marble',
    'Redstone',
  ];

  // RealEstateAgent / Organization structured data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'LocalBusiness', 'Organization'],
    '@id': `${baseUrl}#organization`,
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    url: baseUrl,
    telephone: settings?.contactInfo?.phone,
    email: settings?.contactInfo?.email,
    priceRange: '$$$$',
    logo: orgLogoUrl,
    image: orgLogoUrl || fallbackImageUrl,
    address: settings?.contactInfo?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.contactInfo.address,
          addressLocality: 'Aspen',
          addressRegion: 'CO',
          addressCountry: 'US',
        }
      : {
          '@type': 'PostalAddress',
          addressLocality: 'Aspen',
          addressRegion: 'CO',
          addressCountry: 'US',
        },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.1911,
      longitude: -106.8175,
    },
    areaServed: areaServedCities.map((name) => ({
      '@type': 'City',
      name,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Roaring Fork Valley, Colorado',
      },
    })),
    knowsAbout: [
      'Luxury real estate',
      'Aspen real estate',
      'Snowmass real estate',
      'Roaring Fork Valley homes',
      'Mountain properties',
      'Ski-in ski-out homes',
    ],
    sameAs: [
      settings?.socialMedia?.facebook,
      settings?.socialMedia?.instagram,
      settings?.socialMedia?.twitter,
      settings?.socialMedia?.linkedin,
      settings?.socialMedia?.youtube,
    ].filter(Boolean),
  };

  // WebSite schema with SearchAction for sitelinks search box
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: settings?.title || 'Real Estate',
    url: baseUrl,
    description: settings?.description,
    inLanguage: 'en-US',
    publisher: {
      '@id': `${baseUrl}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/listings?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // WebPage schema for homepage
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}#webpage`,
    url: baseUrl,
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    inLanguage: 'en-US',
    dateModified: new Date().toISOString(),
    isPartOf: {
      '@id': `${baseUrl}#website`,
    },
    about: {
      '@id': `${baseUrl}#organization`,
    },
    primaryImageOfPage: fallbackImageUrl ? {
      '@type': 'ImageObject',
      url: fallbackImageUrl,
    } : undefined,
  };

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={webPageSchema} />

      <HomepageContent
        template={settings?.template}
        videoUrl={videoUrl}
        fallbackImageUrl={fallbackImageUrl}
        heroVideos={heroVideos.length > 1 ? heroVideos : undefined}
        heroTitle={hero?.title}
        heroSubtitle={hero?.subtitle}
        heroSeoDescription={hero?.seoDescription}
        showSearch={hero?.showSearch !== false}
        showTitleSubtitle={hero?.showTitleSubtitle !== false}
        teamSection={{
          enabled: teamSection?.enabled,
          title: teamSection?.title,
          imagePosition: teamSection?.imagePosition,
          featuredTeamMember: teamSection?.featuredTeamMember,
          primaryButtonText: teamSection?.primaryButtonText,
          primaryButtonLink: teamSection?.primaryButtonLink,
          secondaryButtonText: teamSection?.secondaryButtonText,
          secondaryButtonLink: teamSection?.secondaryButtonLink,
        }}
        accolades={{
          enabled: accolades?.enabled,
          title: accolades?.title,
          seoDescription: accolades?.seoDescription,
          backgroundImage: accolades?.backgroundImage,
          items: accolades?.items,
        }}
        agentMlsId={teamSection?.featuredTeamMember?.mlsAgentId}
        officeName={settings?.template === 'rcsothebys-custom' ? 'Retter' : undefined}
        heroMinPrice={settings?.template === 'rcsothebys-custom' ? 950000 : undefined}
        heroSortBy={settings?.template === 'rcsothebys-custom' ? 'price' : undefined}
        heroLimit={settings?.template === 'rcsothebys-custom' ? 10 : undefined}
        heroProperties={heroProperties}
        featuredProperty={{
          enabled: featuredProperty?.enabled,
          mlsId: featuredProperty?.mlsId,
          mlsIds: autoFeaturedMlsIds.length > 0 ? autoFeaturedMlsIds : undefined,
          title: featuredProperty?.title,
          headline: featuredProperty?.headline,
          buttonText: featuredProperty?.buttonText,
          videos: featuredProperty?.videos?.map(v => v.videoFile?.asset?.url || v.videoUrl).filter(Boolean) as string[] | undefined,
        }}
        featuredPropertiesCarousel={{
          enabled: homepage?.featuredPropertiesCarousel?.enabled,
          title: homepage?.featuredPropertiesCarousel?.title,
          subtitle: homepage?.featuredPropertiesCarousel?.subtitle,
          seoDescription: homepage?.featuredPropertiesCarousel?.seoDescription,
          cities: homepage?.featuredPropertiesCarousel?.cities,
          limit: homepage?.featuredPropertiesCarousel?.limit,
          buttonText: homepage?.featuredPropertiesCarousel?.buttonText,
        }}
        featuredCommunities={{
          title: featuredCommunitiesConfig?.title,
          communities: processedCommunities,
        }}
        marketStatsSection={{
          enabled: homepage?.marketStatsSection?.enabled,
          title: homepage?.marketStatsSection?.title,
          subtitle: homepage?.marketStatsSection?.subtitle,
          seoDescription: homepage?.marketStatsSection?.seoDescription,
          cities: homepage?.marketStatsSection?.cities,
        }}
        logoUrl={branding?.logo?.asset?.url ? urlFor(branding.logo).width(420).url() : undefined}
        logoAlt={branding?.logoAlt || settings?.title}
        inTheNews={{
          enabled: homepage?.inTheNews?.enabled,
          title: homepage?.inTheNews?.title,
          subtitle: homepage?.inTheNews?.subtitle,
          articles: homepage?.inTheNews?.articles,
        }}
      />
    </>
  );
}
