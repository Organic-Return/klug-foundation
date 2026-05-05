'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelTitle: string;
}

interface VideosGridProps {
  videos: VideoItem[];
}

export default function VideosGrid({ videos }: VideosGridProps) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');

  // Close on Escape, lock body scroll while open
  useEffect(() => {
    if (!activeVideoId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideoId(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [activeVideoId]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <article
            key={video.videoId}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
          >
            {/* Thumbnail — opens the in-page modal player */}
            <button
              type="button"
              onClick={() => {
                setActiveVideoId(video.videoId);
                setActiveTitle(video.title);
              }}
              aria-label={`Play ${video.title}`}
              className="group block w-full"
            >
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {/* Proxy through Next's image optimizer (no
                    `unoptimized`) so the browser sees a request to
                    our own /_next/image endpoint instead of
                    i.ytimg.com. Sidesteps ad-blocker rules that
                    target YouTube CDN hostnames and leave the card
                    as a black tile. */}
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200 shadow-lg">
                    <svg
                      className="w-7 h-7 text-white ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Title + description — links to the detail page */}
            <Link
              href={`/videos/${video.videoId}`}
              className="group block p-4"
            >
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[var(--color-gold)] transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {video.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{video.channelTitle}</span>
                <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {activeVideoId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setActiveVideoId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeTitle || 'Video player'}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveVideoId(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] font-light"
              aria-label="Close video"
            >
              Close
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full aspect-video bg-black overflow-hidden rounded-lg shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title={activeTitle || 'YouTube video player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
