import { PortableText, type PortableTextComponents } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteName, getBaseUrl } from "@/lib/settings";

interface PressArticleDoc {
  _id: string;
  title: string;
  slug?: { current?: string };
  sourceName: string;
  sourceLogo?: { asset?: { _id?: string; url?: string } };
  url: string;
  image?: { asset?: { _id?: string; url?: string } };
  excerpt?: string;
  body?: any[];
  publishedAt?: string;
}

const PRESS_ARTICLE_QUERY = `*[_type == "pressArticle" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  sourceName,
  sourceLogo { asset->{ _id, url } },
  url,
  image { asset->{ _id, url } },
  excerpt,
  body,
  publishedAt
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(
    `*[_type == "pressArticle" && defined(slug.current)].slug.current`,
    {},
    options
  );
  return (slugs || []).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, siteName, baseUrl] = await Promise.all([
    client.fetch<PressArticleDoc | null>(PRESS_ARTICLE_QUERY, { slug }, options),
    getSiteName(),
    getBaseUrl(),
  ]);

  if (!article) return { title: 'Article Not Found' };

  const title = `${article.title} | ${siteName}`;
  const description = article.excerpt || `${article.title} — featured in ${article.sourceName}.`;
  const ogImage = article.image?.asset?.url
    ? urlFor(article.image)?.width(1200).height(630).fit('crop').url() || undefined
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/in-the-news/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/in-the-news/${slug}`,
      publishedTime: article.publishedAt,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  };
}

const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: any; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value)?.width(1200).url();
      if (!imageUrl) return null;
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <Image src={imageUrl} alt={value.alt || ''} fill className="object-cover" />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-sm text-[#6a6a6a] dark:text-gray-400 text-center">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 className="font-serif text-2xl md:text-3xl text-[#1a1a1a] dark:text-white mt-12 mb-4 tracking-wide">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-serif text-xl md:text-2xl text-[#1a1a1a] dark:text-white mt-10 mb-3 tracking-wide">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 py-2 my-8 italic text-lg text-[#3a3a3a] dark:text-gray-300">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-base md:text-lg text-[#3a3a3a] dark:text-gray-300 font-light leading-relaxed mb-6">
        {children}
      </p>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = value?.href || '#';
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-[var(--color-gold)] underline underline-offset-2 hover:text-[var(--color-sothebys-blue)] transition-colors"
        >
          {children}
        </a>
      );
    },
  },
};

export default async function PressArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await client.fetch<PressArticleDoc | null>(PRESS_ARTICLE_QUERY, { slug }, options);

  if (!article) notFound();

  const heroImageUrl = article.image?.asset?.url
    ? urlFor(article.image)?.width(1920).height(800).fit('crop').url() || null
    : null;
  const logoUrl = article.sourceLogo?.asset?.url
    ? urlFor(article.sourceLogo)?.height(80).url() || null
    : null;

  return (
    <main className="-mt-20 min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-24 bg-[var(--color-sothebys-blue)]">
        {heroImageUrl && (
          <>
            <Image
              src={heroImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              quality={95}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/70" aria-hidden="true" />
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          {logoUrl ? (
            <div className="relative h-10 md:h-12 w-auto mb-6 mx-auto" style={{ width: 'fit-content' }}>
              <Image
                src={logoUrl}
                alt={article.sourceName}
                width={240}
                height={48}
                className="object-contain brightness-0 invert opacity-90"
              />
            </div>
          ) : (
            <p className="text-[var(--color-gold)] text-xs md:text-sm tracking-[0.3em] uppercase mb-4">
              {article.sourceName}
            </p>
          )}
          <h1 className="font-serif text-white tracking-wide mb-6">
            {article.title}
          </h1>
          {article.publishedAt && (
            <p className="text-sm text-white/70 tracking-wider uppercase">
              {formatDate(article.publishedAt)}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16">
          {article.excerpt && (
            <p className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white leading-relaxed mb-10 pb-10 border-b border-[#e8e6e3] dark:border-gray-800">
              {article.excerpt}
            </p>
          )}

          {Array.isArray(article.body) && article.body.length > 0 ? (
            <div className="prose-base">
              <PortableText value={article.body} components={portableTextComponents} />
            </div>
          ) : (
            <p className="text-base md:text-lg text-[#6a6a6a] dark:text-gray-400 font-light leading-relaxed">
              Continue reading the full article at {article.sourceName}.
            </p>
          )}

          {/* External CTA */}
          <div className="mt-12 pt-10 border-t border-[#e8e6e3] dark:border-gray-800 text-center">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-sothebys-blue)] text-white text-sm tracking-[0.2em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300"
            >
              Read the Full Article at {article.sourceName}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/in-the-news"
              className="text-sm text-[#6a6a6a] dark:text-gray-400 tracking-wider uppercase hover:text-[var(--color-gold)] transition-colors"
            >
              ← Back to In the News
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
