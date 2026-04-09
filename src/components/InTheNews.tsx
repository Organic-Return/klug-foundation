import Image from 'next/image';
import Link from 'next/link';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface PressArticle {
  _id: string;
  title: string;
  sourceName: string;
  sourceLogo?: any;
  url: string;
  image?: any;
  excerpt?: string;
  publishedAt?: string;
}

interface InTheNewsProps {
  title?: string;
  subtitle?: string;
  articles?: PressArticle[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function InTheNews({
  title = 'In the News',
  subtitle = 'As featured in leading publications',
  articles = [],
}: InTheNewsProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f8f7f5] dark:bg-[#0a0a0a]">
      <div className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-serif text-[var(--color-sothebys-blue)] dark:text-white mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[#6a6a6a] dark:text-gray-400 text-sm tracking-wider uppercase font-light">
                {subtitle}
              </p>
            )}
            <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mt-6" />
          </div>

          {/* Articles Grid */}
          <div className={`grid gap-8 ${
            articles.length === 1
              ? 'grid-cols-1 max-w-2xl mx-auto'
              : articles.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : articles.length === 3
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {articles.map((article) => (
              <a
                key={article._id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[var(--color-gold)]/30"
              >
                {/* Article Image */}
                {article.image?.asset?.url ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={urlFor(article.image).width(600).height(375).url()}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Source badge overlay */}
                    {article.sourceLogo?.asset?.url ? (
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 px-3 py-1.5 backdrop-blur-sm">
                        <div className="relative h-4 w-20">
                          <Image
                            src={urlFor(article.sourceLogo).height(32).url()}
                            alt={article.sourceName}
                            fill
                            className="object-contain object-left"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 px-3 py-1.5 backdrop-blur-sm">
                        <span className="text-xs font-medium tracking-wider uppercase text-[#1a1a1a] dark:text-white">
                          {article.sourceName}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No image - show source prominently */
                  <div className="relative aspect-[16/10] bg-[var(--color-sothebys-blue)] dark:bg-[#141414] flex items-center justify-center">
                    {article.sourceLogo?.asset?.url ? (
                      <div className="relative h-8 w-32">
                        <Image
                          src={urlFor(article.sourceLogo).height(64).url()}
                          alt={article.sourceName}
                          fill
                          className="object-contain brightness-0 invert"
                        />
                      </div>
                    ) : (
                      <span className="font-serif text-lg text-white/80 tracking-wider">
                        {article.sourceName}
                      </span>
                    )}
                  </div>
                )}

                {/* Article Content */}
                <div className="p-5">
                  {/* Source name (when image exists, show below) */}
                  {!article.sourceLogo?.asset?.url && article.image?.asset?.url && (
                    <p className="text-[var(--color-gold)] text-xs font-medium tracking-wider uppercase mb-2">
                      {article.sourceName}
                    </p>
                  )}

                  <h3 className="font-serif text-[#1a1a1a] dark:text-white text-base leading-snug mb-3 line-clamp-3 group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light leading-relaxed line-clamp-2 mb-3">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e5] dark:border-gray-800">
                    {article.publishedAt && (
                      <span className="text-[#999] dark:text-gray-500 text-xs font-light">
                        {formatDate(article.publishedAt)}
                      </span>
                    )}
                    <span className="text-[var(--color-gold)] text-xs tracking-wider uppercase font-medium ml-auto group-hover:translate-x-1 transition-transform duration-300">
                      Read Article &rarr;
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* View All Link */}
          <div className="text-center mt-8">
            <Link
              href="/in-the-news"
              className="sir-btn"
            >
              <span>View All Articles</span>
              <span className="sir-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
