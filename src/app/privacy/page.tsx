import { client } from "@/sanity/client";
import type { Metadata } from "next";
import { getSiteTemplate, withBrand } from "@/lib/settings";
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
  const metaTitle = await withBrand(data?.seo?.metaTitle || data?.title || 'Privacy Policy');

  return {
    title: metaTitle,
    description: data?.seo?.metaDescription || 'Privacy policy',
    alternates: { canonical: `${baseUrl}/privacy` },
    openGraph: {
      title: metaTitle,
      description: data?.seo?.metaDescription || '',
      type: 'website',
      url: `${baseUrl}/privacy`,
    },
  };
}

export default async function PrivacyPolicyPage() {
  const [data, template] = await Promise.all([
    client.fetch(QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === 'rcsothebys-custom';

  // The policy itself, not a "Return Home" stub: the stub was a 200 with no
  // heading and no content, linked from every page's footer.
  if (!isRC) {
    return (
      <main className="min-h-screen pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h1 className="font-serif text-[#1a1a1a] dark:text-white mb-10">{data?.title || 'Privacy Policy'}</h1>
          {data?.contentHtml ? (
            <div
              className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8] [&_p]:mb-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_a]:underline [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6"
              dangerouslySetInnerHTML={{ __html: data.contentHtml }}
            />
          ) : (
            // No "privacy-policy" site page exists in Sanity yet; the footer links
            // here from every page, so it must not 404.
            <p className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8]">
              Our full privacy policy is being prepared. For questions about how we handle your information,{' '}
              <Link href="/contact-us" className="underline underline-offset-4">contact us</Link>.
            </p>
          )}
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
