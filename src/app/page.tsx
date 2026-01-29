import { Metadata } from 'next';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';
import { getHomepageData } from '@/lib/homepage';
import { getSettings } from '@/lib/settings';
import StructuredData from '@/components/StructuredData';
import HomepageContent from '@/components/HomepageContent';

const builder = imageUrlBuilder(client);

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

  // Get video URL (either from Mux/uploaded file or external URL)
  const videoUrl = hero?.videoFile?.asset?.url || hero?.videoUrl;
  const fallbackImageUrl = hero?.fallbackImage?.asset?.url
    ? urlFor(hero.fallbackImage).width(1920).url()
    : undefined;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: settings?.title || 'Real Estate',
    description: settings?.description,
    url: settings?.siteUrl,
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

  return (
    <>
      <StructuredData data={structuredData} />

      <HomepageContent
        template={homepage?.template}
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
        featuredProperty={{
          enabled: featuredProperty?.enabled,
          mlsId: featuredProperty?.mlsId,
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
