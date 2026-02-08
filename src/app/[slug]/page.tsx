import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import MuxVideoPlayer from "@/components/MuxVideoPlayer";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  ...,
  body[]{
    ...,
    _type == "mux.video" => {
      ...,
      asset->
    }
  }
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

// Generate metadata for SEO, Open Graph, and Twitter Cards
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  // Use custom SEO image if available, otherwise use post image
  const seoImageUrl = post.seo?.ogImage
    ? urlFor(post.seo.ogImage)?.width(1200).height(630).url()
    : post.image
    ? urlFor(post.image)?.width(1200).height(630).url()
    : null;

  // Use custom meta title or fall back to post title
  const metaTitle = post.seo?.metaTitle || post.title;

  // Use custom meta description or extract from body
  let metaDescription = post.seo?.metaDescription || post.title;
  if (!post.seo?.metaDescription && Array.isArray(post.body)) {
    const firstTextBlock = post.body.find((block: any) => block._type === 'block' && block.children);
    if (firstTextBlock) {
      metaDescription = firstTextBlock.children
        .map((child: any) => child.text)
        .join('')
        .slice(0, 160);
    }
  }

  // Get the base URL from environment or use a default
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const canonicalUrl = `${baseUrl}/${slug}`;

  // Handle noIndex robots meta tag
  const robotsConfig = post.seo?.noIndex
    ? {
        index: false,
        follow: false,
      }
    : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: post.seo?.keywords?.join(', '),
    robots: robotsConfig,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt || post.publishedAt,
      authors: ['Real Estate Website'],
      url: canonicalUrl,
      images: seoImageUrl
        ? [
            {
              url: seoImageUrl,
              width: 1200,
              height: 630,
              alt: metaTitle,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: seoImageUrl ? [seoImageUrl] : [],
    },
  };
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => <p className="mb-4">{children}</p>,
    h1: ({ children }: { children?: ReactNode }) => <h1 className="text-[var(--color-sothebys-blue)] mt-8 mb-4">{children}</h1>,
    h2: ({ children }: { children?: ReactNode }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
    h3: ({ children }: { children?: ReactNode }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
    blockquote: ({ children }: { children?: ReactNode }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>,
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    code: ({ children }: { children?: ReactNode }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{children}</code>,
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => {
      const href = value?.href || '';
      return <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
    },
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
    number: ({ children }: { children?: ReactNode }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => <li className="mb-1">{children}</li>,
    number: ({ children }: { children?: ReactNode }) => <li className="mb-1">{children}</li>,
  },
  types: {
    image: ({ value }: { value: { asset: any; alt?: string; caption?: string } }) => {
      const imageUrl = urlFor(value.asset)?.width(1028).url();
      return (
        <figure className="my-8 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="max-w-[1028px] mx-auto px-8">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={value.alt || ''}
                className="w-full h-auto"
              />
            )}
            {value.caption && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
                {value.caption}
              </figcaption>
            )}
          </div>
        </figure>
      );
    },
    'mux.video': ({ value }: { value: { asset?: { playbackId?: string } } }) => {
      const playbackId = value?.asset?.playbackId;
      if (!playbackId) return null;

      return <MuxVideoPlayer playbackId={playbackId} />;
    },
    code: ({ value }: { value: { code?: string; language?: string; filename?: string } }) => {
      return (
        <div className="my-6">
          {value.filename && (
            <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-lg">
              {value.filename}
            </div>
          )}
          <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${value.filename ? 'rounded-b-lg' : 'rounded-lg'}`}>
            <code className="text-sm font-mono">{value.code}</code>
          </pre>
        </div>
      );
    },
  },
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch<SanityDocument>(POST_QUERY, { slug }, options);

  if (!post) {
    return (
      <main className="container mx-auto min-h-screen max-w-3xl p-8">
        <Link href="/blog" className="hover:underline">
          ← Back to posts
        </Link>
        <h1 className="text-[var(--color-sothebys-blue)] mb-8">Post not found</h1>
      </main>
    );
  }

  const postImageUrl = post.image
    ? urlFor(post.image)?.width(1200).height(675).url()
    : null;

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: postImageUrl || undefined,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Real Estate Website',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Real Estate Website',
      logo: {
        '@type': 'ImageObject',
        url: postImageUrl || undefined,
      },
    },
    description: post.title,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container mx-auto min-h-screen flex flex-col gap-4">
        <div className="max-w-3xl mx-auto w-full px-8 pt-8">
          <Link href="/blog" className="hover:underline">
            ← Back to posts
          </Link>
        </div>
      {postImageUrl && (
        <div className="relative w-full max-w-[1200px] mx-auto aspect-video">
          <img
            src={postImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            width="1200"
            height="675"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-[1200px] px-8">
              <h1 className="text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto w-full px-8 pb-8 pt-8">
        <div className="prose prose-lg max-w-none">
          <p className="my-[10px]">Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
          {Array.isArray(post.body) && (
            <PortableText value={post.body} components={components} />
          )}
        </div>
      </div>
    </main>
    </>
  );
}
