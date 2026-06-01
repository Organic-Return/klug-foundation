import type { Metadata } from 'next';
import Image from 'next/image';
import { getSiteName, getBaseUrl, getDefaultHeroImageUrl } from '@/lib/settings';
import ContactPageForm from '@/components/ContactPageForm';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Contact Us | ${siteName}`,
    description:
      'Get in touch with our team about luxury real estate in Aspen, Snowmass Village, and the Roaring Fork Valley. We respond within 24 hours.',
    alternates: { canonical: `${baseUrl}/contact-us` },
    openGraph: {
      title: `Contact Us | ${siteName}`,
      description: 'Reach the Klug Properties team.',
      url: `${baseUrl}/contact-us`,
    },
  };
}

export default async function ContactPage() {
  const heroImageRaw = await getDefaultHeroImageUrl();

  return (
    <main className="-mt-20 min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-2 md:pt-44 md:pb-2 bg-[var(--color-sothebys-blue)]">
        {heroImageRaw && (
          <>
            <Image
              src={heroImageRaw}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={95}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" aria-hidden="true" />
          </>
        )}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">Contact Us</h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            Reach out for personal introductions, off-market access, or any question about a property we&apos;ve listed.
            A member of our team responds within 24 hours.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16">
          <ContactPageForm />
        </div>
      </section>
    </main>
  );
}
