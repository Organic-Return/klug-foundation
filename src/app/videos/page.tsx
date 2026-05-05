import Link from "next/link";
import type { Metadata } from "next";
import { getYouTubeCredentials } from "@/lib/settings";
import VideosGrid from "@/components/VideosGrid";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: 'Videos | Real Estate Tours & Content',
    description: 'Watch our latest real estate videos and virtual tours.',
    alternates: {
      canonical: `${baseUrl}/videos`,
    },
    openGraph: {
      title: 'Videos | Real Estate Tours & Content',
      description: 'Watch our latest real estate videos and virtual tours.',
      url: `${baseUrl}/videos`,
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
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
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
        const thumb =
          item.snippet.thumbnails.high?.url
          || item.snippet.thumbnails.medium?.url
          || item.snippet.thumbnails.default?.url;
        if (!thumb || !item.snippet.resourceId?.videoId) continue;
        all.push({
          id: { videoId: item.snippet.resourceId.videoId },
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
  const videos = await getYouTubeVideos();

  return (
    <main className="container mx-auto min-h-screen max-w-7xl p-8">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to home
        </Link>
        <h1 className="text-[var(--color-sothebys-blue)] mb-2">Videos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Watch our latest real estate videos and virtual tours
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-2xl font-semibold text-[var(--color-sothebys-blue)] mb-2">No videos available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure your YouTube API credentials to display videos.
          </p>
          <div className="text-sm text-left max-w-2xl mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg">
            <p className="font-semibold mb-2">Setup instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Get a YouTube API key from the Google Cloud Console</li>
              <li>Find your YouTube Channel ID</li>
              <li>Add credentials in Sanity Studio (Site Settings) or in your .env.local file:</li>
            </ol>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 text-xs overflow-x-auto">
              {`YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here`}
            </pre>
          </div>
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
    </main>
  );
}

