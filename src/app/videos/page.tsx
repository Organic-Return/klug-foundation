import Link from "next/link";
import type { Metadata } from "next";
import { getYouTubeCredentials } from "@/lib/settings";

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

interface YouTubeResponse {
  items: YouTubeVideo[];
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
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=20&type=video`;

    console.log('📡 Fetching YouTube videos...');
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ YouTube API error:', response.status, errorText);
      return [];
    }

    const data: YouTubeResponse = await response.json();
    console.log('✅ Successfully fetched', data.items?.length || 0, 'videos');

    return data.items || [];
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a
              key={video.id.videoId}
              href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                <img
                  src={video.snippet.thumbnails.high.url}
                  alt={video.snippet.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-8 h-8 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.snippet.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {video.snippet.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{video.snippet.channelTitle}</span>
                  <span>
                    {new Date(video.snippet.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
