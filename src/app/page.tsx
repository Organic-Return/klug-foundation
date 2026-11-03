import { Metadata } from 'next';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData, getAllCommunities } from '@/lib/homepage';
import { getSettings, getBranding } from '@/lib/settings';
import { getNewestHighPricedByCities, getNewestHighPricedByCity, getListingsByAgentId } from '@/lib/listings';
import { getFeaturedListings, getHomepageCityStats, getNewestListings } from '@/lib/homepageSections';
import SchemaGraph from '@/components/SchemaGraph';
import FaqSection, { faqEntries } from '@/components/FaqSection';
import HomepageContent from '@/components/HomepageContent';
import { getTenant, webPageNode, serviceNode, faqNode, ids } from '@/lib/schema';

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || settings?.siteUrl || 'https://example.com';

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

  // A bare brand name ranks for nothing. When the CMS has no explicit homepage SEO
  // title, fall back to a geo-qualified one rather than the site title alone.
  // An editor-set metaTitle still wins, and we don't double up if the site title
  // already carries the geo keywords.
  const defaultTitle = /aspen/i.test(siteTitle)
    ? siteTitle
    : `${siteTitle} | Aspen & Snowmass Luxury Real Estate`;
  const pageTitle = seo?.metaTitle || defaultTitle;

  return {
    title: pageTitle,
    description: seo?.metaDescription || settings?.description,
    keywords: seo?.keywords,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: pageTitle,
      description: seo?.metaDescription || settings?.description,
      url: baseUrl,
      siteName: siteTitle,
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      title: pageTitle,
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

  // Resolve hero video sources. Mux is preferred — it offloads streaming
  // from Sanity (where bandwidth is metered) to Mux's CDN. Legacy
  // videoFile/videoUrl fields are still honored when Mux isn't set so
  // editors don't see a broken hero between deploy and the migration
  // upload step.
  const playbackId = hero?.muxVideo?.asset?.playbackId;
  const videoUrl = hero?.videoFile?.asset?.url || hero?.videoUrl;
  const fallbackImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1920).url()
    : undefined;

  // Build hero videos array (primary + additional)
  const heroVideos: Array<{ videoUrl?: string; muxPlaybackId?: string; posterUrl?: string }> = [];
  if (playbackId || videoUrl || fallbackImageUrl) {
    heroVideos.push({ muxPlaybackId: playbackId, videoUrl, posterUrl: fallbackImageUrl });
  }
  if (hero?.additionalVideos) {
    for (const v of hero.additionalVideos) {
      const vMux = v.muxVideo?.asset?.playbackId;
      const url = v.videoFile?.asset?.url || v.videoUrl;
      const poster = v.poster?.asset?.url
        ? urlFor(v.poster).width(1920).url()
        : fallbackImageUrl; // Fall back to primary hero image so the
                            // slide has a visible background while the
                            // video element is still loading.
      if (vMux || url || poster) {
        heroVideos.push({ muxPlaybackId: vMux, videoUrl: url, posterUrl: poster });
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

  // Pre-fetch the classic sections that otherwise load in the browser, so the
  // featured property, Market Insights and the newest listings are in the HTML
  // for crawlers that do not run JavaScript. The conditions mirror the ones
  // HomepageContent renders each section under.
  const template = settings?.template || 'classic';
  const marketStatsCities = (homepage?.marketStatsSection?.cities || [])
    .filter((c) => c.enabled)
    .map((c) => c.city);
  const featuredIds =
    autoFeaturedMlsIds.length > 0 ? autoFeaturedMlsIds : featuredProperty?.mlsId ? [featuredProperty.mlsId] : [];
  const [featuredListingsInitial, cityStatsInitial, newestListingsInitial] =
    template === 'classic'
      ? await Promise.all([
          featuredProperty?.enabled && featuredIds.length > 0
            ? getFeaturedListings(featuredIds)
            : Promise.resolve(undefined),
          homepage?.marketStatsSection?.enabled !== false
            ? getHomepageCityStats(marketStatsCities.length > 0 ? marketStatsCities : undefined)
            : Promise.resolve(undefined),
          homepage?.featuredPropertiesCarousel?.enabled !== false
            ? getNewestListings(
                homepage?.featuredPropertiesCarousel?.cities || undefined,
                homepage?.featuredPropertiesCarousel?.limit || 8
              )
            : Promise.resolve(undefined),
        ])
      : [undefined, undefined, undefined];

  // Page-level structured data. The business, agent and website nodes come
  // from the root layout; this page adds its WebPage, the services the
  // business offers and the site-wide FAQ (rendered below the content).
  const tenant = await getTenant();
  const homeUrl = `${tenant.baseUrl}/`;
  const homeFaqs = faqEntries(tenant.faqs as Parameters<typeof faqEntries>[0]);
  const schemaNodes = [
    webPageNode({
      tenant,
      url: homeUrl,
      name: settings?.title || tenant.siteTitle,
      description: settings?.description,
      image: fallbackImageUrl,
      aboutId: ids.organization(tenant.baseUrl),
    }),
    ...tenant.services.map((service) =>
      serviceNode({
        serviceType: service.serviceType,
        description: service.description,
        providerId: ids.organization(tenant.baseUrl),
        areaServed: tenant.areaServed,
        url: homeUrl,
      })
    ),
    faqNode(homeUrl, homeFaqs),
  ];

  return (
    <>
      <SchemaGraph nodes={schemaNodes} />

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
        featuredListingsInitial={featuredListingsInitial}
        cityStatsInitial={cityStatsInitial}
        newestListingsInitial={newestListingsInitial}
        inTheNews={{
          enabled: homepage?.inTheNews?.enabled,
          title: homepage?.inTheNews?.title,
          subtitle: homepage?.inTheNews?.subtitle,
          articles: homepage?.inTheNews?.articles,
        }}
      />
      <FaqSection faqs={tenant.faqs as Parameters<typeof faqEntries>[0]} />
    </>
  );
}
