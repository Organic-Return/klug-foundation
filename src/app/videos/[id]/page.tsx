import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getYouTubeCredentials } from '@/lib/settings';
import { getSiteName, getBaseUrl } from '@/lib/settings';

interface VideoSnippet {
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

async function getVideo(videoId: string): Promise<VideoSnippet | null> {
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

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [snippet, baseUrl, siteName] = await Promise.all([
    getVideo(id),
    getBaseUrl(),
    getSiteName(),
  ]);
  if (!snippet) return { title: 'Video Not Found' };
  const description = snippet.description?.slice(0, 160)
    || `Watch ${snippet.title} on ${siteName}.`;
  const ogImage =
    snippet.thumbnails.maxres?.url
    || snippet.thumbnails.standard?.url
    || snippet.thumbnails.high?.url;
  return {
    title: `${snippet.title} | ${siteName}`,
    description,
    alternates: { canonical: `${baseUrl}/videos/${id}` },
    openGraph: {
      title: snippet.title,
      description,
      url: `${baseUrl}/videos/${id}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: 'video.other',
    },
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const snippet = await getVideo(id);
  if (!snippet) notFound();

  // Split the description on blank lines so each paragraph renders as
  // its own <p>; YouTube descriptions otherwise come through as one
  // wall of text with embedded \n characters.
  const paragraphs = snippet.description
    ? snippet.description
        .split(/\n\s*\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Player band */}
      <section className="bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`}
              title={snippet.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="mb-8 text-sm font-light">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all videos
            </Link>
          </div>

          <p className="text-[var(--color-gold)] text-xs uppercase tracking-[0.25em] font-light mb-4">
            {snippet.channelTitle}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-3">
            {snippet.title}
          </h1>
          <p className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            {new Date(snippet.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="w-12 h-px bg-[var(--color-gold)] mb-8" />

          {paragraphs.length > 0 && (
            <div className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8] text-[16px] md:text-[17px] space-y-5 whitespace-pre-line">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
