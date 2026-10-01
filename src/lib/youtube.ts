import { getYouTubeCredentials } from './settings';

// The channel's uploads, shared by the videos index and the per-video page.
// Both fetches are cached by Next for an hour, so the index and the detail
// pages see the same list.

export interface YouTubeVideo {
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

export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
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

export interface VideoSnippet {
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnails: {
    maxres?: { url: string };
    standard?: { url: string };
    high?: { url: string };
  };
}

export async function getVideo(videoId: string): Promise<VideoSnippet | null> {
  const { apiKey } = await getYouTubeCredentials();
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&key=${apiKey}&part=snippet`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.snippet ?? null;
  } catch {
    return null;
  }
}

const normaliseTitle = (title: string) => title.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * The same tour is often uploaded more than once (a Short cut from the full
 * video, a re-upload with new hashtags) under an identical title and
 * description. Those pages are duplicates of each other; the first upload
 * is the canonical one and the rest point at it. Returns null when this
 * video is the original or has no same-title sibling.
 */
export async function findCanonicalVideoId(videoId: string, title: string): Promise<string | null> {
  const videos = await getYouTubeVideos();
  const key = normaliseTitle(title);
  const siblings = videos
    .filter((v) => normaliseTitle(v.snippet.title) === key)
    .sort((a, b) => a.snippet.publishedAt.localeCompare(b.snippet.publishedAt));
  const original = siblings[0]?.id.videoId;
  return original && original !== videoId ? original : null;
}
