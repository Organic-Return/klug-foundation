import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import RCSitePage from "@/components/RCSitePage";
import Link from "next/link";

const QUERY = `*[_type == "sitePage" && slug.current == "privacy-policy"][0]{
  title,
  contentHtml,
  showContactForm,
  seo
}`;

const options = { next: { revalidate: 60 } };

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(QUERY, {}, options);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: data?.seo?.metaTitle || data?.title || 'Privacy Policy',
    description: data?.seo?.metaDescription || 'Privacy policy',
    alternates: { canonical: `${baseUrl}/privacy-policy` },
    openGraph: {
      title: data?.seo?.metaTitle || data?.title || 'Privacy Policy',
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/privacy-policy`,
    },
  };
}

export default async function PrivacyPolicyPage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  if (!isRC) {
    return (
      <main className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-8">
            <Link href="/" className="text-[var(--color-gold)] hover:underline">Return Home</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <RCSitePage
      title={data?.title || 'Privacy Policy'}
      contentHtml={data?.contentHtml}
      showContactForm={false}
    />
  );
}
