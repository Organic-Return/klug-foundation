import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client, writeClient } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import MuxVideoPlayer from "@/components/MuxVideoPlayer";
import Demographics from "@/components/Demographics";
import CommunityMarketStats from "@/components/CommunityMarketStats";
import RecentListings from "@/components/RecentListings";
import NearbySchools from "@/components/NearbySchools";
import NearbyAttractions from "@/components/NearbyAttractions";
import CommunityHero from "@/components/CommunityHero";
import CommunityNeighborhoods from "@/components/CommunityNeighborhoods";
import ModernContactCTA from "@/components/ModernContactCTA";
import CustomOneMarketStats from "@/components/CustomOneMarketStats";
import CustomOneLocalHighlights from "@/components/CustomOneLocalHighlights";
import { fetchDemographicData, formatCurrency, formatNumber } from "@/lib/census";
import { getCommunityPriceRange } from "@/lib/listings";
import { getSettings } from "@/lib/settings";

const COMMUNITY_QUERY = `*[_type == "community" && slug.current == $slug][0]{
  ...,
  marketInsightsCity,
  nearbySchools,
  localHighlights,
  neighborhoods[] {
    ...,
    image {
      asset-> {
        url
      }
    }
  },
  nearbyAttractions[] {
    ...,
    image {
      asset-> {
        url
      }
    }
  },
  body[]{
    ...,
    _type == "mux.video" => {
      ...,
      asset->
    }
  }
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

// Generate metadata for SEO, Open Graph, and Twitter Cards
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await client.fetch<SanityDocument>(COMMUNITY_QUERY, { slug }, options);

  if (!community) {
    return {
      title: 'Community Not Found',
    };
  }

  // Use custom SEO image if available, otherwise use featured image
  const seoImageUrl = community.seo?.ogImage
    ? urlFor(community.seo.ogImage)?.width(1200).height(630).url()
    : community.featuredImage
    ? urlFor(community.featuredImage)?.width(1200).height(630).url()
    : null;

  // Use custom meta title or fall back to community title
  const metaTitle = community.seo?.metaTitle || community.title;

  // Use custom meta description or extract from body/description
  let metaDescription = community.seo?.metaDescription || community.description || community.title;
  if (!community.seo?.metaDescription && !community.description && Array.isArray(community.body)) {
    const firstTextBlock = community.body.find((block: any) => block._type === 'block' && block.children);
    if (firstTextBlock) {
      metaDescription = firstTextBlock.children
        .map((child: any) => child.text)
        .join('')
        .slice(0, 160);
    }
  }

  // Get the base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const canonicalUrl = `${baseUrl}/communities/${slug}`;

  // Handle noIndex robots meta tag
  const robotsConfig = community.seo?.noIndex
    ? {
        index: false,
        follow: false,
      }
    : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: community.seo?.keywords?.join(', '),
    robots: robotsConfig,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: canonicalUrl,
      images: seoImageUrl
        ? [
            {
              url: seoImageUrl,
              width: 1200,
              height: 630,
              alt: metaTitle,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: seoImageUrl ? [seoImageUrl] : [],
    },
  };
}

// Sotheby's-inspired elegant PortableText components
const components: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="font-serif text-[#1a1a1a] dark:text-white mt-12 mb-6">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-10 mb-5 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-4 tracking-wide">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
    code: ({ children }: { children?: ReactNode }) => <code className="bg-[#f5f5f5] dark:bg-gray-800 px-2 py-1 text-sm font-mono">{children}</code>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const href = value?.href || '';
      return (
        <a
          href={href}
          className="text-[var(--color-navy)] dark:text-[var(--color-gold)] border-b border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors duration-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="ml-6 mb-6 space-y-2">{children}</ul>,
    number: ({ children }: { children?: ReactNode }) => <ol className="ml-6 mb-6 space-y-2 list-decimal">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="text-[#4a4a4a] dark:text-gray-300 leading-relaxed font-light pl-2 relative before:content-[''] before:absolute before:left-[-1rem] before:top-[0.6rem] before:w-1.5 before:h-1.5 before:bg-[var(--color-gold)] before:rounded-full">{children}</li>
    ),
    number: ({ children }: { children?: ReactNode }) => (
      <li className="text-[#4a4a4a] dark:text-gray-300 leading-relaxed font-light pl-2">{children}</li>
    ),
  },
  types: {
    image: ({ value }: { value: { asset: any; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value.asset)?.width(1200).url();
      return (
        <figure className="my-12">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={value.alt || ''}
              className="w-full h-auto"
            />
          )}
          {value.caption && (
            <figcaption className="text-sm text-[#6a6a6a] dark:text-gray-400 mt-4 font-light italic tracking-wide">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    'mux.video': ({ value }: { value: { asset?: { playbackId?: string } } }) => {
      const playbackId = value?.asset?.playbackId;
      if (!playbackId) return null;

      return (
        <div className="my-12">
          <MuxVideoPlayer playbackId={playbackId} />
        </div>
      );
    },
    code: ({ value }: { value: { code?: string; language?: string; filename?: string } }) => {
      return (
        <div className="my-8">
          {value.filename && (
            <div className="bg-[#1a1a1a] text-gray-300 px-5 py-3 text-sm font-mono border-b border-gray-700">
              {value.filename}
            </div>
          )}
          <pre className={`bg-[#1a1a1a] text-gray-100 p-5 overflow-x-auto`}>
            <code className="text-sm font-mono">{value.code}</code>
          </pre>
        </div>
      );
    },
  },
};

// Luxury template PortableText components
const luxuryComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[var(--color-warm-gray)] leading-[1.8] font-luxury-body font-light text-[17px]">{children}</p>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="font-luxury text-[var(--color-charcoal)] mt-12 mb-6 font-light tracking-wide">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-luxury font-light text-[var(--color-charcoal)] mt-10 mb-5 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-luxury font-light text-[var(--color-charcoal)] mt-8 mb-4 tracking-wide">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[var(--color-warm-gray)] font-luxury text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[var(--color-charcoal)]">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-luxury">{children}</em>,
    code: ({ children }: { children?: ReactNode }) => <code className="bg-[#f6f1eb] px-2 py-1 text-sm font-mono">{children}</code>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const href = value?.href || '';
      return (
        <a
          href={href}
          className="text-[var(--color-charcoal)] border-b border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors duration-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="ml-6 mb-6 space-y-2">{children}</ul>,
    number: ({ children }: { children?: ReactNode }) => <ol className="ml-6 mb-6 space-y-2 list-decimal">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => (
      <li className="text-[var(--color-warm-gray)] leading-relaxed font-luxury-body font-light pl-2 relative before:content-[''] before:absolute before:left-[-1rem] before:top-[0.6rem] before:w-1.5 before:h-1.5 before:bg-[var(--color-gold)] before:rounded-full">{children}</li>
    ),
    number: ({ children }: { children?: ReactNode }) => (
      <li className="text-[var(--color-warm-gray)] leading-relaxed font-luxury-body font-light pl-2">{children}</li>
    ),
  },
  types: {
    image: ({ value }: { value: { asset: any; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value.asset)?.width(1200).url();
      return (
        <figure className="my-12">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={value.alt || ''}
              className="w-full h-auto"
            />
          )}
          {value.caption && (
            <figcaption className="text-sm text-[var(--color-warm-gray)] mt-4 font-luxury-body font-light italic tracking-wide">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    'mux.video': ({ value }: { value: { asset?: { playbackId?: string } } }) => {
      const playbackId = value?.asset?.playbackId;
      if (!playbackId) return null;
      return (
        <div className="my-12">
          <MuxVideoPlayer playbackId={playbackId} />
        </div>
      );
    },
    code: ({ value }: { value: { code?: string; language?: string; filename?: string } }) => {
      return (
        <div className="my-8">
          {value.filename && (
            <div className="bg-[var(--color-charcoal)] text-gray-300 px-5 py-3 text-sm font-mono border-b border-gray-700">
              {value.filename}
            </div>
          )}
          <pre className="bg-[var(--color-charcoal)] text-gray-100 p-5 overflow-x-auto">
            <code className="text-sm font-mono">{value.code}</code>
          </pre>
        </div>
      );
    },
  },
};

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [community, settings] = await Promise.all([
    client.fetch<SanityDocument>(COMMUNITY_QUERY, { slug }, options),
    getSettings(),
  ]);

  const template = settings?.template || 'classic';
  const isLuxury = template === 'luxury' || template === 'custom-one';
  const isCustomOne = template === 'custom-one';
  const variant = isLuxury ? 'luxury' : 'classic';

  if (!community) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <Link href="/" className="hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-[var(--color-sothebys-blue)] mb-8">Community not found</h1>
      </main>
    );
  }

  // Fetch demographic data if coordinates are available and demographics are missing or outdated
  let demographics = community.demographics;
  console.log('🏘️  Community coordinates:', community.coordinates);
  console.log('📊 Existing demographics:', demographics);

  // Check if demographics data is complete (has population data, not just lastUpdated)
  const hasCompleteData = demographics && demographics.population;

  if (community.coordinates && (!hasCompleteData)) {
    console.log('🔄 Fetching demographic data from Census API...');
    const fetchedDemographics = await fetchDemographicData({
      lat: community.coordinates.lat,
      lng: community.coordinates.lng,
    });

    if (fetchedDemographics) {
      demographics = {
        ...fetchedDemographics,
        lastUpdated: new Date().toISOString(),
      };

      // Update Sanity with the fetched demographics (requires SANITY_API_TOKEN env var)
      if (process.env.SANITY_API_TOKEN) {
        try {
          console.log('💾 Saving demographics to Sanity...');
          await writeClient
            .patch(community._id)
            .set({ demographics })
            .commit();
          console.log('✅ Demographics saved successfully');
        } catch (error) {
          console.error('❌ Failed to update demographics in Sanity:', error);
        }
      } else {
        console.log('ℹ️  SANITY_API_TOKEN not configured, demographics will be fetched on each request');
      }
    }
  } else {
    console.log('ℹ️  Skipping demographic fetch:',
      !community.coordinates ? 'No coordinates' :
      hasCompleteData ? `Already has complete data (population: ${demographics.population})` :
      'Unknown reason');
  }

  // Higher resolution for hero image (full width)
  const heroImageUrl = community.featuredImage
    ? urlFor(community.featuredImage)?.width(1920).height(800).url()
    : null;

  // Fetch dynamic price range based on active listings
  let priceRange: string | null = null;
  if (community.marketInsightsCity) {
    const { lowestCondo, highestSingleFamily } = await getCommunityPriceRange(community.marketInsightsCity);

    // Format price range if we have at least one value
    if (lowestCondo || highestSingleFamily) {
      const formatPriceShort = (price: number) => {
        if (price >= 1000000) {
          return `$${(price / 1000000).toFixed(1)}M`.replace('.0M', 'M');
        }
        return `$${(price / 1000).toFixed(0)}K`;
      };

      if (lowestCondo && highestSingleFamily) {
        priceRange = `${formatPriceShort(lowestCondo)} - ${formatPriceShort(highestSingleFamily)}`;
      } else if (lowestCondo) {
        priceRange = `From ${formatPriceShort(lowestCondo)}`;
      } else if (highestSingleFamily) {
        priceRange = `Up to ${formatPriceShort(highestSingleFamily)}`;
      }
    }
  }

  // Get the base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const communityUrl = `${baseUrl}/communities/${community.slug.current}`;

  // Generate JSON-LD structured data for SEO - Place schema
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': communityUrl,
    name: community.title,
    description: community.description || community.title,
    url: communityUrl,
    image: heroImageUrl || undefined,
    geo: community.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: community.coordinates.lat,
      longitude: community.coordinates.lng,
    } : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: community.title,
      addressRegion: 'CO',
      addressCountry: 'US',
    },
    ...(community.amenities && community.amenities.length > 0 && {
      amenityFeature: community.amenities.map((amenity: string) => ({
        '@type': 'LocationFeatureSpecification',
        name: amenity,
      })),
    }),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Communities',
        item: `${baseUrl}/communities`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: community.title,
        item: communityUrl,
      },
    ],
  };

  // WebPage schema
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${communityUrl}#webpage`,
    url: communityUrl,
    name: community.title,
    description: community.description || community.title,
    isPartOf: {
      '@id': `${baseUrl}#website`,
    },
    primaryImageOfPage: heroImageUrl ? {
      '@type': 'ImageObject',
      url: heroImageUrl,
    } : undefined,
    breadcrumb: {
      '@id': `${communityUrl}#breadcrumb`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <main className="min-h-screen">
        {/* Hero Section */}
        {heroImageUrl ? (
          <CommunityHero
            title={community.title}
            description={community.description}
            imageUrl={heroImageUrl}
            priceRange={priceRange || undefined}
            variant={variant}
          />
        ) : (
          /* Fallback hero when no featured image - pt-20 for fixed header */
          <div className={isLuxury ? 'bg-[var(--color-charcoal)] pt-28 pb-16 px-6' : 'bg-[var(--color-navy)] pt-28 pb-16 px-6'}>
            <div className="max-w-7xl mx-auto">
              <h1 className={isLuxury ? 'font-luxury text-white font-light tracking-wide' : 'text-white'}>
                {community.title}
              </h1>
              {community.description && (
                <p className={isLuxury ? 'text-lg text-white/70 mt-6 max-w-2xl font-luxury-body font-light' : 'text-lg text-white/80 mt-6 max-w-2xl'}>
                  {community.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content Sections - Sotheby's Inspired Design */}
        <div className="flex flex-col">

          {/* About & Demographics - Elegant Two Column Layout */}
          <section className={isLuxury ? 'py-32 md:py-44 bg-white' : 'py-16 md:py-24 bg-white dark:bg-[#1a1a1a]'}>
            <div className={isLuxury ? 'max-w-[1440px] mx-auto px-8 lg:px-12' : 'max-w-7xl mx-auto px-6 md:px-12 lg:px-16'}>
              {isCustomOne ? (
                /* Custom-one: centered full-width about content, no sidebar */
                <div className="max-w-4xl mx-auto text-center">
                  {Array.isArray(community.body) && community.body.length > 0 && (
                    <>
                      <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-[var(--modern-black)] mb-10 tracking-wide leading-tight">
                        Discover {community.title}
                      </h2>
                      <div className="max-w-none text-left mx-auto">
                        <PortableText value={community.body} components={isLuxury ? luxuryComponents : components} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                  {/* Left Column - About This Community */}
                  <div className="lg:col-span-7">
                    {Array.isArray(community.body) && community.body.length > 0 && (
                      <>
                        {isLuxury ? (
                          <>
                            <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
                              About
                            </p>
                            <div className="w-px h-8 bg-[var(--color-taupe)] mb-6" />
                            <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] mb-10 tracking-wide leading-tight">
                              Discover {community.title}
                            </h2>
                          </>
                        ) : (
                          <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-10 tracking-wide leading-tight">
                            Discover {community.title}
                          </h2>
                        )}

                        <div className="max-w-none">
                          <PortableText value={community.body} components={isLuxury ? luxuryComponents : components} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column - Demographics Sidebar */}
                  <div className="lg:col-span-5">
                    <div className="lg:sticky lg:top-28">
                      <Demographics demographics={demographics} variant={variant} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Demographics - Horizontal section (custom-one only) */}
          {isCustomOne && demographics && demographics.population && (
            <section className="py-24 md:py-32 bg-[var(--modern-black)] relative overflow-hidden">
              {/* Texture overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`
                }} />
              </div>

              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
                <div className="text-center mb-16 md:mb-20">
                  <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide">
                    Community Profile
                  </h2>
                </div>

                {/* Primary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12">
                  {demographics.population && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {formatNumber(demographics.population)}
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        Population
                      </div>
                    </div>
                  )}
                  {demographics.households && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {formatNumber(demographics.households)}
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        Households
                      </div>
                    </div>
                  )}
                  {demographics.medianAge && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {demographics.medianAge}
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        Median Age
                      </div>
                    </div>
                  )}
                  {demographics.medianIncome && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {formatCurrency(demographics.medianIncome)}
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        Median Income
                      </div>
                    </div>
                  )}
                  {demographics.medianHomeValue && demographics.medianHomeValue > 0 && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {formatCurrency(demographics.medianHomeValue)}
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        Home Value
                      </div>
                    </div>
                  )}
                  {demographics.bachelorsDegreePercent && (
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl lg:text-4xl font-light text-[var(--modern-gold)] mb-3 tracking-wide">
                        {demographics.bachelorsDegreePercent}%
                      </div>
                      <div className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                        College Educated
                      </div>
                    </div>
                  )}
                </div>

                {/* Ownership bar */}
                {demographics.tenure && demographics.tenure.ownerOccupiedPercent !== undefined && (
                  <>
                    <div className="w-24 h-[1px] bg-[var(--modern-gold)] mx-auto my-12 md:my-16" />
                    <div className="max-w-md mx-auto">
                      <div
                        className="w-full bg-white/10 h-2 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={demographics.tenure.ownerOccupiedPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${demographics.tenure.ownerOccupiedPercent}% owner-occupied, ${100 - demographics.tenure.ownerOccupiedPercent}% renter-occupied`}
                      >
                        <div
                          className="bg-[var(--modern-gold)] h-full transition-all duration-500"
                          style={{ width: `${demographics.tenure.ownerOccupiedPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-[0.15em] text-white/50 mt-3">
                        <span>{demographics.tenure.ownerOccupiedPercent}% Owners</span>
                        <span>{100 - demographics.tenure.ownerOccupiedPercent}% Renters</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Source */}
                <div className="text-center mt-12">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                    Source: U.S. Census Bureau, ACS 5-Year Estimates
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Elegant Divider */}
          {!isLuxury && (
            <div className="w-full flex justify-center py-4 bg-[#f8f7f5] dark:bg-[#141414]">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
            </div>
          )}

          {/* Full-width community image break - luxury only (not custom-one) */}
          {isLuxury && !isCustomOne && community.featuredImage && (
            <section className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
              <Image
                src={urlFor(community.featuredImage)?.width(2400).height(1200).url() || ''}
                alt={community.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className={`absolute inset-0 bg-gradient-to-b ${isCustomOne ? 'from-white via-transparent to-[var(--modern-black)]' : 'from-white via-transparent to-[#f6f1eb]'}`} />
            </section>
          )}

          {/* Amenities Section - Refined Grid */}
          {community.amenities && community.amenities.length > 0 && (
            <section className={
              isCustomOne
                ? 'py-32 md:py-44 bg-[var(--modern-black)] relative overflow-hidden'
                : isLuxury
                  ? 'py-32 md:py-44 bg-[#f6f1eb]'
                  : 'py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]'
            }>
              {/* Texture overlay - custom-one only */}
              {isCustomOne && (
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`
                  }} />
                </div>
              )}

              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
                {/* Section Header */}
                {isCustomOne ? (
                  <div className="text-center mb-16 md:mb-20">
                    <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide">
                      Community Amenities
                    </h2>
                  </div>
                ) : isLuxury ? (
                  <div className="text-center mb-16 md:mb-20">
                    <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
                      Lifestyle
                    </p>
                    <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide">
                      Community Amenities
                    </h2>
                  </div>
                ) : (
                  <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
                      Community Amenities
                    </h2>
                  </div>
                )}

                {/* Amenities Grid */}
                {isCustomOne ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 list-none">
                    {community.amenities.map((amenity: string, index: number) => (
                      <li
                        key={index}
                        className="group bg-white/[0.06] p-7 md:p-8 border border-white/10 hover:border-[var(--modern-gold)]/60 transition-all duration-500 flex items-center gap-5"
                      >
                        <span className="w-2 h-2 rounded-full bg-[var(--modern-gold)] flex-shrink-0 group-hover:scale-125 transition-transform duration-500" aria-hidden="true" />
                        <span className="text-sm md:text-[15px] text-white/70 font-light tracking-wide group-hover:text-white transition-colors duration-500">
                          {amenity}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : isLuxury ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {community.amenities.map((amenity: string, index: number) => (
                      <div
                        key={index}
                        className="group bg-white p-7 md:p-8 border border-[var(--color-taupe)]/20 hover:border-[var(--color-gold)]/60 transition-all duration-500 flex items-center gap-5"
                      >
                        <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] flex-shrink-0 group-hover:scale-125 transition-transform duration-500" />
                        <span className="text-sm md:text-[15px] font-luxury-body text-[var(--color-warm-gray)] font-light tracking-wide group-hover:text-[var(--color-charcoal)] transition-colors duration-500">
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {community.amenities.map((amenity: string, index: number) => (
                      <div
                        key={index}
                        className="group bg-white dark:bg-[#1a1a1a] p-5 md:p-6 border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-all duration-300"
                      >
                        <span className="text-sm md:text-base text-[#4a4a4a] dark:text-gray-300 font-light tracking-wide group-hover:text-[#1a1a1a] dark:group-hover:text-white transition-colors">
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Neighborhoods Section - Only for city communities */}
          {community.communityType === 'city' && community.neighborhoods && community.neighborhoods.length > 0 && (
            <CommunityNeighborhoods
              neighborhoods={community.neighborhoods}
              communitySlug={community.slug.current}
              communityTitle={community.title}
              variant={variant}
              colorScheme="light"
              layout={isCustomOne ? 'gallery' : 'default'}
            />
          )}

          {/* Market Insights Section */}
          {community.marketInsightsCity && (
            isCustomOne ? (
              <CustomOneMarketStats
                city={community.marketInsightsCity}
                title={`${community.title} Market Insights`}
              />
            ) : (
              <div className={isLuxury ? 'bg-[#f6f1eb]' : 'bg-[#f8f7f5] dark:bg-[#141414]'}>
                <CommunityMarketStats
                  city={community.marketInsightsCity}
                  title={`${community.title} Market Insights`}
                  subtitle={`Real-time market data for ${community.marketInsightsCity}`}
                  variant={variant}
                />
              </div>
            )
          )}

          {/* Recent Listings Section */}
          {community.marketInsightsCity && (
            <div className={isCustomOne ? 'bg-white' : isLuxury ? 'bg-white' : 'bg-white dark:bg-[#1a1a1a]'}>
              <RecentListings
                city={community.marketInsightsCity}
                limit={isCustomOne ? 3 : 10}
                title={`Recent Listings in ${community.title}`}
                subtitle={`The most recently listed properties in ${community.marketInsightsCity}`}
                variant={variant}
              />
            </div>
          )}

          {/* Schools & Attractions Combined Section */}
          {((community.nearbySchools && community.nearbySchools.length > 0) ||
            (community.nearbyAttractions && community.nearbyAttractions.length > 0)) && (
            <section
              className={
                isCustomOne
                  ? 'py-32 md:py-44 bg-[var(--modern-black)] relative overflow-hidden'
                  : isLuxury
                    ? 'py-32 md:py-44 bg-[#f6f1eb]'
                    : 'py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]'
              }
            >
              {/* Texture overlay - custom-one only */}
              {isCustomOne && (
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, var(--modern-gold) 40px, var(--modern-gold) 41px)`
                  }} />
                </div>
              )}

              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
                {/* Section Header */}
                {isCustomOne ? (
                  <div className="text-center mb-16 md:mb-20">
                    <div className="w-16 h-[1px] bg-[var(--modern-gold)] mx-auto mb-8" />
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide mb-5">
                      {community.localHighlights?.sectionTitle || 'Local Highlights'}
                    </h2>
                    <p className="text-white/60 font-light max-w-xl mx-auto text-sm tracking-wide">
                      {community.localHighlights?.sectionSubtitle || 'Discover the exceptional schools, dining, and attractions that make this community truly special.'}
                    </p>
                  </div>
                ) : isLuxury ? (
                  <div className="text-center mb-16 md:mb-20">
                    <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
                      Explore
                    </p>
                    <div className="w-px h-8 bg-[var(--color-taupe)] mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-luxury font-light text-[var(--color-charcoal)] tracking-wide mb-5">
                      {community.localHighlights?.sectionTitle || 'Local Highlights'}
                    </h2>
                    <p className="font-luxury-body text-[var(--color-warm-gray)] font-light max-w-xl mx-auto text-sm tracking-wide">
                      {community.localHighlights?.sectionSubtitle || 'Discover the exceptional schools, dining, and attractions that make this community truly special.'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center mb-14 md:mb-20">
                    <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.3em] font-light mb-4 block">
                      Explore
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
                      {community.localHighlights?.sectionTitle || 'Local Highlights'}
                    </h2>
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
                    </div>
                    <p className="text-[#6a6a6a] dark:text-gray-400 font-light max-w-2xl mx-auto text-lg leading-relaxed">
                      {community.localHighlights?.sectionSubtitle || 'Discover the exceptional schools, dining, and attractions that make this community truly special.'}
                    </p>
                  </div>
                )}

                {isCustomOne ? (
                  <CustomOneLocalHighlights
                    attractions={community.nearbyAttractions}
                    schools={community.nearbySchools}
                    attractionsTitle={community.localHighlights?.attractionsTitle}
                    schoolsTitle={community.localHighlights?.schoolsTitle}
                  />
                ) : (
                  <>
                    {/* Schools */}
                    {community.nearbySchools && community.nearbySchools.length > 0 && (
                      <div className="mb-16">
                        <NearbySchools
                          schools={community.nearbySchools}
                          title={community.localHighlights?.schoolsTitle}
                          subtitle={community.localHighlights?.schoolsSubtitle}
                          variant={variant}
                        />
                      </div>
                    )}

                    {/* Attractions */}
                    {community.nearbyAttractions && community.nearbyAttractions.length > 0 && (
                      <NearbyAttractions
                        attractions={community.nearbyAttractions}
                        title={community.localHighlights?.attractionsTitle}
                        subtitle={community.localHighlights?.attractionsSubtitle}
                        variant={variant}
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* Contact CTA Section */}
          {isCustomOne ? (
            <ModernContactCTA />
          ) : isLuxury ? (
            <section className="py-32 md:py-44 bg-[var(--color-charcoal)] relative overflow-hidden">
              {/* Background image with overlay */}
              {heroImageUrl && (
                <div className="absolute inset-0">
                  <img
                    src={heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-20"
                    style={{ filter: 'grayscale(100%)' }}
                  />
                  <div className="absolute inset-0 bg-[var(--color-charcoal)]/80" />
                </div>
              )}
              <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
                <p className="text-[var(--color-gold)] text-[11px] uppercase tracking-[0.3em] font-light mb-5 font-luxury-body">
                  Connect
                </p>
                <div className="w-px h-10 bg-white/20 mx-auto mb-8" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-luxury font-light text-white tracking-wide mb-8 leading-tight">
                  Begin Your Journey
                </h2>
                <p className="font-luxury-body text-white/50 font-light mb-12 max-w-xl mx-auto text-sm tracking-wide leading-relaxed">
                  Connect with our team to discover the exceptional lifestyle awaiting you in {community.title}.
                </p>

                <Link
                  href="/contact-us"
                  className="group inline-flex items-center gap-4 font-luxury-body text-white text-[13px] uppercase tracking-[0.25em]"
                >
                  <span className="border-b border-white/30 pb-1 group-hover:border-[var(--color-gold)] transition-colors duration-500">
                    Schedule a Consultation
                  </span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </section>
          ) : (
            <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] relative overflow-hidden">
              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              </div>

              <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
                  Begin Your Journey
                </h2>
                <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                  Connect with our team to discover the exceptional lifestyle awaiting you in {community.title}.
                </p>

                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-sothebys-blue)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                >
                  Schedule a Consultation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
