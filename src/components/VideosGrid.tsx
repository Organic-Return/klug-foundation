'use client';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <article
          key={video.videoId}
          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
        >
          {/* Inline YouTube embed — plays in place. No overlay, no
              custom play button, no thumbnail image. The iframe
              itself is the click target; YouTube's native play
              button is what the user taps. */}
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

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
  );
}
