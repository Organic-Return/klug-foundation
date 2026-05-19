import Image from "next/image";
import type { Metadata } from "next";
import { getYouTubeCredentials, getBaseUrl, getSiteName, getDefaultHeroImageUrl } from "@/lib/settings";
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

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

interface PlaylistItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      maxres?: { url: string };
      standard?: { url: string };
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishedAt: string;
    channelTitle: string;
    resourceId: { videoId: string };
  };
}

interface PlaylistItemsResponse {
  items: PlaylistItem[];
  nextPageToken?: string;
}

interface ChannelsResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  // YouTube channel IDs that start with "UC" can be converted to the
  // matching uploads playlist by replacing the second char with "U"
  // (UCxxxx → UUxxxx). Verify with the API as a fallback.
  if (channelId.startsWith('UC')) {
    return 'UU' + channelId.slice(2);
  }
  const url = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=contentDetails`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data: ChannelsResponse = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  const { apiKey, channelId } = await getYouTubeCredentials();

  console.log('🎥 YouTube API Key configured:', apiKey ? 'Yes' : 'No');
  console.log('📺 YouTube Channel ID configured:', channelId ? 'Yes' : 'No');

  if (!apiKey || !channelId) {
    console.warn('⚠️  YouTube API credentials not configured. Videos will not be fetched.');
    return [];
  }

  try {
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId);
    if (!uploadsPlaylistId) {
      console.error('❌ Could not resolve uploads playlist for channel', channelId);
      return [];
    }

    // Page through the uploads playlist so we get every video, not just
    // the most recent 20 (search.list silently truncates and skips items).
    const all: YouTubeVideo[] = [];
    let pageToken: string | undefined;
    const maxPages = 10; // safety cap → up to 500 videos

    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({
        key: apiKey,
        playlistId: uploadsPlaylistId,
        part: 'snippet',
        maxResults: '50',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
        { next: { revalidate: 3600 } }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ YouTube API error:', response.status, errorText);
        break;
      }
      const data: PlaylistItemsResponse = await response.json();
      for (const item of data.items || []) {
        // Prefer the proper 16:9 thumbnails (maxres / standard) over
        // hqdefault — YouTube returns hqdefault as 480×360 with black
        // bars on top and bottom, which renders as a mostly-black tile
        // when cropped into a wide aspect-video container.
        const t = item.snippet.thumbnails;
        const videoId = item.snippet.resourceId?.videoId;
        const thumb =
          t.maxres?.url
          || (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : undefined)
          || t.standard?.url
          || t.high?.url
          || t.medium?.url
          || t.default?.url;
        if (!thumb || !videoId) continue;
        all.push({
          id: { videoId },
          snippet: {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnails: { high: { url: thumb } },
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
          },
        });
      }
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    console.log('✅ Successfully fetched', all.length, 'videos');
    return all;
  } catch (error) {
    console.error('❌ Error fetching YouTube videos:', error);
    return [];
  }
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
    <main className="min-h-screen">
      {/* Hero Section — transparent header sits on top, so add extra top padding */}
      <section
        className={`relative pt-36 pb-2 md:pt-44 md:pb-2 ${heroImageRaw ? '' : 'bg-[var(--color-sothebys-blue)]'}`}
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
            />
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

