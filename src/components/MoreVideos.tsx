import Image from 'next/image';
import Link from 'next/link';
import { getYouTubeVideos } from '@/lib/youtube';

/**
 * The four uploads that follow this one in channel order, wrapping at the
 * end. Each video page was linked only from the index, so a crawler saw
 * every video as a one-link dead end.
 */
export default async function MoreVideos({ currentId }: { currentId: string }) {
  const videos = await getYouTubeVideos();
  const others = videos.filter((v) => v.id.videoId !== currentId);
  if (others.length === 0) return null;
  const index = Math.max(0, videos.findIndex((v) => v.id.videoId === currentId));
  const picks = Array.from({ length: Math.min(4, others.length) }, (_, i) => others[(index + i) % others.length]);

  return (
    <section className="py-16 md:py-20 bg-[#f8f7f5] dark:bg-[#141414] border-t border-[#e8e6e3] dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex items-end justify-between mb-8 gap-6">
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">More Videos</h2>
          <Link href="/media/videos" className="hidden sm:inline-block text-xs tracking-[0.15em] uppercase text-[var(--color-sothebys-blue)] dark:text-white hover:text-[var(--color-gold)] border-b border-current pb-1 transition-colors whitespace-nowrap">
            All Videos
          </Link>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {picks.map((v) => (
            <li key={v.id.videoId}>
              <Link href={`/media/videos/${v.id.videoId}`} className="group block">
                <div className="relative aspect-video overflow-hidden bg-black mb-3">
                  <Image src={v.snippet.thumbnails.high.url} alt={v.snippet.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <p className="text-sm font-light text-[#1a1a1a] dark:text-white line-clamp-2 group-hover:text-[var(--color-gold)] transition-colors">{v.snippet.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
