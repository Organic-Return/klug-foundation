import Image from "next/image";
import type { Metadata } from "next";
import { getBaseUrl, getSiteName, getDefaultHeroImageUrl } from "@/lib/settings";
import { getYouTubeVideos } from "@/lib/youtube";
import { client } from "@/sanity/client";
import VideosGrid from "@/components/VideosGrid";

interface VideosPageDoc {
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: { asset?: { url?: string } };
  sectionTitle?: string;
  sectionDescription?: string;
  emptyTitle?: string;
  emptyText?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: { url?: string } };
  };
}

const PAGE_QUERY = `*[_type == "videosPage" && _id == "videosPage"][0]{
  heroTitle,
  heroDescription,
  heroImage { asset->{ url } },
  sectionTitle,
  sectionDescription,
  emptyTitle,
  emptyText,
  seo {
    metaTitle,
    metaDescription,
    ogImage { asset->{ url } }
  }
}`;

const pageOptions = { next: { revalidate: 30 } };

async function getPageData(): Promise<VideosPageDoc | null> {
  return client.fetch<VideosPageDoc | null>(PAGE_QUERY, {}, pageOptions);
}

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName, page] = await Promise.all([getBaseUrl(), getSiteName(), getPageData()]);
  const heroTitle = page?.heroTitle || 'Videos';
  const title = page?.seo?.metaTitle || `${heroTitle} | ${siteName}`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || 'Watch our latest real estate videos and virtual tours.';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/media/videos`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/media/videos`,
    },
  };
}

export default async function VideosPage() {
  const [videos, page, defaultHeroUrl] = await Promise.all([
    getYouTubeVideos(),
    getPageData(),
    getDefaultHeroImageUrl(),
  ]);

  const heroTitle = page?.heroTitle || 'Videos';
  const heroDescription = page?.heroDescription
    || 'Watch our latest real estate videos, property tours, and lifestyle content from Aspen Snowmass and the Roaring Fork Valley.';
  const sectionTitle = page?.sectionTitle || 'Latest Videos';
  const sectionDescription = page?.sectionDescription;
  const emptyTitle = page?.emptyTitle || 'No Videos Yet';
  const emptyText = page?.emptyText
    || 'New videos and virtual property tours will appear here. Check back soon.';

  const heroImageRaw: string | null = page?.heroImage?.asset?.url || defaultHeroUrl;

  return (
    <main className="-mt-20 min-h-screen">
      {/* Hero Section — transparent header sits on top, so add extra top padding */}
      <section
        className="relative pt-36 pb-2 md:pt-44 md:pb-2 bg-[var(--color-sothebys-blue)]"
      >
        {heroImageRaw && (
          <>
            <Image
              src={heroImageRaw}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            quality={95}
              />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" aria-hidden="true" />
          </>
        )}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Above-grid intro */}
      <section className="pt-12 md:pt-16 pb-6 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h2 className="font-serif text-[#1a1a1a] dark:text-white tracking-wide my-[0.5em]">
            {sectionTitle}
          </h2>
          {sectionDescription && (
            <p className="text-[#4a4a4a] dark:text-gray-300 font-light max-w-3xl leading-relaxed">
              {sectionDescription}
            </p>
          )}
        </div>
      </section>

      {/* Videos grid (or empty state) */}
      <section className="pb-16 md:pb-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-3">
                {emptyTitle}
              </h2>
              <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
                {emptyText}
              </p>
            </div>
          ) : (
            <VideosGrid
              videos={videos.map((v) => ({
                videoId: v.id.videoId,
                title: v.snippet.title,
                description: v.snippet.description,
                thumbnailUrl: v.snippet.thumbnails.high.url,
                publishedAt: v.snippet.publishedAt,
                channelTitle: v.snippet.channelTitle,
              }))}
            />
          )}
        </div>
      </section>
    </main>
  );
}

