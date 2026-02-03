'use client';

// Classic template components
import HeroWithSearch from '@/components/HeroWithSearch';
import TeamSection from '@/components/TeamSection';
import Accolades from '@/components/Accolades';
import ClassicFeaturedProperty from '@/components/ClassicFeaturedProperty';
import FeaturedAspenProperties from '@/components/FeaturedAspenProperties';
import CityStats from '@/components/CityStats';

// Luxury template components
import LuxuryHero from '@/components/LuxuryHero';
import LuxuryPropertyCarousel from '@/components/LuxuryPropertyCarousel';
import LuxuryAbout from '@/components/LuxuryAbout';
import LuxuryQuoteBlock from '@/components/LuxuryQuoteBlock';
import LuxuryCityStats from '@/components/LuxuryCityStats';
import LuxuryFeaturedProperty from '@/components/LuxuryFeaturedProperty';
import LuxuryCommunities from '@/components/LuxuryCommunities';

// Modern template components
import ModernHero from '@/components/ModernHero';
import ModernAbout from '@/components/ModernAbout';
import ModernQuoteBlock from '@/components/ModernQuoteBlock';
import ModernFeaturedProperty from '@/components/ModernFeaturedProperty';
import ModernPropertyCarousel from '@/components/ModernPropertyCarousel';
import ModernCityStats from '@/components/ModernCityStats';

interface HomepageContentProps {
  // Template selection from Sanity
  template?: 'classic' | 'luxury' | 'modern';
  // Hero data
  videoUrl?: string;
  fallbackImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  showSearch?: boolean;
  showTitleSubtitle?: boolean;

  // Team section data
  teamSection?: {
    enabled?: boolean;
    title?: string;
    imagePosition?: 'left' | 'right';
    featuredTeamMember?: any;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };

  // Accolades data
  accolades?: {
    enabled?: boolean;
    title?: string;
    backgroundImage?: any;
    items?: any[];
  };

  // Featured property data
  featuredProperty?: {
    enabled?: boolean;
    mlsId?: string;
    title?: string;
    headline?: string;
    buttonText?: string;
  };

  // Agent MLS ID from team member (for featured property gallery)
  agentMlsId?: string;

  // Featured properties carousel data
  featuredPropertiesCarousel?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    cities?: string[];
    limit?: number;
    buttonText?: string;
  };

  // Featured Communities data
  featuredCommunities?: {
    title?: string;
    communities?: Array<{
      _id: string;
      title: string;
      slug: { current: string };
      description?: string;
      imageUrl?: string;
    }>;
  };

  // Market Stats section data
  marketStatsSection?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    cities?: Array<{
      city: string;
      enabled: boolean;
    }>;
  };
}

export default function HomepageContent({
  template = 'classic',
  videoUrl,
  fallbackImageUrl,
  heroTitle,
  heroSubtitle,
  showSearch,
  showTitleSubtitle,
  teamSection,
  accolades,
  featuredProperty,
  agentMlsId,
  featuredPropertiesCarousel,
  featuredCommunities,
  marketStatsSection,
}: HomepageContentProps) {
  // Extract enabled cities from market stats configuration
  const marketStatsCities = marketStatsSection?.cities
    ?.filter(c => c.enabled)
    ?.map(c => c.city) || [];
  // Modern Template
  if (template === 'modern') {
    return (
      <>
        {/* Modern Hero - Rolex/Patek Philippe inspired */}
        <ModernHero
          videoUrl={videoUrl}
          fallbackImageUrl={fallbackImageUrl}
          title={heroTitle || 'Exceptional Properties'}
          subtitle={heroSubtitle || 'Discover a curated collection of the world\'s finest residences'}
        />

        {/* About Section - Clean, sophisticated layout */}
        <ModernAbout
          title={teamSection?.title || 'Uncompromising Excellence'}
          teamMember={teamSection?.featuredTeamMember}
          primaryButtonText={teamSection?.primaryButtonText}
          primaryButtonLink={teamSection?.primaryButtonLink}
        />

        {/* Stats/Quote Block - Dark section with gold accents */}
        {accolades?.items && accolades.items.length > 0 && (
          <ModernQuoteBlock
            title={accolades.title || 'The Standard of Excellence'}
            items={accolades.items}
          />
        )}

        {/* Featured Property Section */}
        {featuredProperty?.enabled && featuredProperty?.mlsId && (
          <ModernFeaturedProperty
            mlsId={featuredProperty.mlsId}
            headline={featuredProperty.headline}
            buttonText={featuredProperty.buttonText}
          />
        )}

        {/* Property Carousel - Horizontal scroll gallery */}
        {featuredPropertiesCarousel?.enabled !== false && (
          <ModernPropertyCarousel
            cities={featuredPropertiesCarousel?.cities}
            title={featuredPropertiesCarousel?.title || 'Featured Properties'}
            subtitle={featuredPropertiesCarousel?.subtitle}
            limit={featuredPropertiesCarousel?.limit || 8}
          />
        )}

        {/* City Stats Section */}
        {marketStatsSection?.enabled !== false && (
          <ModernCityStats
            title={marketStatsSection?.title}
            subtitle={marketStatsSection?.subtitle}
            configuredCities={marketStatsCities.length > 0 ? marketStatsCities : undefined}
          />
        )}
      </>
    );
  }

  // Classic Template (Template One)
  if (template === 'classic') {
    return (
      <>
        {/* Hero Section with Search */}
        <HeroWithSearch
          videoUrl={videoUrl}
          fallbackImageUrl={fallbackImageUrl}
          title={heroTitle}
          subtitle={heroSubtitle}
          showSearch={showSearch !== false}
          showTitleSubtitle={showTitleSubtitle !== false}
        />

        {/* Team Section */}
        {teamSection?.enabled !== false && teamSection?.featuredTeamMember && (
          <TeamSection
            title={teamSection.title}
            imagePosition={teamSection.imagePosition}
            teamMember={teamSection.featuredTeamMember}
            primaryButtonText={teamSection.primaryButtonText}
            primaryButtonLink={teamSection.primaryButtonLink}
            secondaryButtonText={teamSection.secondaryButtonText}
            secondaryButtonLink={teamSection.secondaryButtonLink}
          />
        )}

        {/* Featured Property Section */}
        {featuredProperty?.enabled && featuredProperty?.mlsId && (
          <ClassicFeaturedProperty
            mlsId={featuredProperty.mlsId}
            headline={featuredProperty.headline}
            buttonText={featuredProperty.buttonText}
          />
        )}

        {/* City Stats Section */}
        {marketStatsSection?.enabled !== false && (
          <CityStats
            title={marketStatsSection?.title}
            subtitle={marketStatsSection?.subtitle}
            configuredCities={marketStatsCities.length > 0 ? marketStatsCities : undefined}
          />
        )}

        {/* Accolades Section */}
        {accolades?.enabled !== false && accolades?.items && accolades.items.length > 0 && (
          <Accolades
            title={accolades.title}
            backgroundImage={accolades.backgroundImage}
            items={accolades.items}
          />
        )}

        {/* Featured Properties Carousel Section */}
        {featuredPropertiesCarousel?.enabled !== false && (
          <FeaturedAspenProperties
            cities={featuredPropertiesCarousel?.cities}
            title={featuredPropertiesCarousel?.title}
            subtitle={featuredPropertiesCarousel?.subtitle}
            limit={featuredPropertiesCarousel?.limit}
            buttonText={featuredPropertiesCarousel?.buttonText}
          />
        )}
      </>
    );
  }

  // Luxury Template (Template Two)
  return (
    <>
      {/* Luxury Hero - Full screen with elegant typography */}
      <LuxuryHero
        videoUrl={videoUrl}
        fallbackImageUrl={fallbackImageUrl}
        title={heroTitle || 'Extraordinary Residences'}
        subtitle={heroSubtitle || 'Discover an unparalleled collection of luxury properties'}
      />

      {/* About Section - Elegant two-column layout */}
      <LuxuryAbout
        title={teamSection?.title || 'The Art of Exceptional Service'}
        teamMember={teamSection?.featuredTeamMember}
        primaryButtonText={teamSection?.primaryButtonText}
        primaryButtonLink={teamSection?.primaryButtonLink}
      />

      {/* Stats/Quote Block - Dark section with statistics */}
      {accolades?.items && accolades.items.length > 0 && (
        <LuxuryQuoteBlock
          title={accolades.title || 'The Distinction'}
          items={accolades.items}
        />
      )}

      {/* Featured Property Section */}
      {featuredProperty?.enabled && (featuredProperty?.mlsId || agentMlsId) && (
        <LuxuryFeaturedProperty
          mlsId={featuredProperty.mlsId}
          agentMlsId={agentMlsId}
          title={featuredProperty.title}
          headline={featuredProperty.headline}
          buttonText={featuredProperty.buttonText}
        />
      )}

      {/* Property Carousel - Rosewood-style horizontal gallery */}
      {featuredPropertiesCarousel?.enabled !== false && (
        <LuxuryPropertyCarousel
          cities={featuredPropertiesCarousel?.cities}
          title={featuredPropertiesCarousel?.title || 'Curated Residences'}
          subtitle={featuredPropertiesCarousel?.subtitle}
          limit={featuredPropertiesCarousel?.limit || 8}
        />
      )}

      {/* City Stats Section */}
      {marketStatsSection?.enabled !== false && (
        <LuxuryCityStats
          title={marketStatsSection?.title}
          subtitle={marketStatsSection?.subtitle}
          configuredCities={marketStatsCities.length > 0 ? marketStatsCities : undefined}
        />
      )}

      {/* Communities Section */}
      {featuredCommunities?.communities && featuredCommunities.communities.length > 0 && (
        <LuxuryCommunities
          title={featuredCommunities.title}
          communities={featuredCommunities.communities}
        />
      )}
    </>
  );
}
