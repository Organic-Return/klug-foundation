import { Metadata } from 'next';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData, getAllCommunities } from '@/lib/homepage';
import { getSettings } from '@/lib/settings';
import { getNewestHighPricedByCities, getNewestHighPricedByCity } from '@/lib/listings';
import StructuredData from '@/components/StructuredData';
import HomepageContent from '@/components/HomepageContent';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

export async function generateMetadata(): Promise<Metadata> {
  const [homepage, settings] = await Promise.all([
    getHomepageData(),
    getSettings(),
  ]);

  const seo = homepage?.seo;
  const siteTitle = settings?.title || 'Real Estate';
  const baseUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

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
      images: seo?.metaImage?.asset?.url
        ? [{ url: urlFor(seo.metaImage).width(1200).url() }]
        : undefined,
    },
  };
}

export default async function Home() {
  const [homepage, settings] = await Promise.all([
    getHomepageData(),
    getSettings(),
  ]);

  const hero = homepage?.hero;
  const teamSection = homepage?.teamSection;
  const accolades = homepage?.accolades;
  const featuredProperty = homepage?.featuredProperty;
  const featuredCommunitiesConfig = homepage?.featuredCommunities;

  // Get video URL (either from Mux/uploaded file or external URL)
  const videoUrl = hero?.videoFile?.asset?.url || hero?.videoUrl;
  const fallbackImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1920).url()
    : undefined;

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

  // RealEstateAgent / Organization structured data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['RealEstateAgent', 'Organization'],
    '@id': `${baseUrl}#organization`,
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    url: baseUrl,
    telephone: settings?.contactInfo?.phone,
    email: settings?.contactInfo?.email,
    address: settings?.contactInfo?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.contactInfo.address,
        }
      : undefined,
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
        heroTitle={hero?.title}
        heroSubtitle={hero?.subtitle}
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
          title: featuredProperty?.title,
          headline: featuredProperty?.headline,
          buttonText: featuredProperty?.buttonText,
        }}
        featuredPropertiesCarousel={{
          enabled: homepage?.featuredPropertiesCarousel?.enabled,
          title: homepage?.featuredPropertiesCarousel?.title,
          subtitle: homepage?.featuredPropertiesCarousel?.subtitle,
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
          cities: homepage?.marketStatsSection?.cities,
        }}
      />
    </>
  );
}
