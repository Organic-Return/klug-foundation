import { PortableText, type SanityDocument, type PortableTextComponents } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import FaqAccordion from "./FaqAccordion";

const BUY_PAGE_QUERY = `*[_type == "buyPage" && _id == "buyPage"][0]{
  heroTitle,
  heroSubtitle,
  heroImage,
  sections[]{
    title,
    content,
    image,
    imagePosition,
    ctaText,
    ctaLink
  },
  faqTitle,
  faqs[]{
    question,
    answer
  },
  ctaTitle,
  ctaSubtitle,
  ctaButtonText,
  ctaButtonLink,
  ctaImage,
  seo
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

// Default content matching the editorial style
const defaults = {
  heroTitle: "Buying Real Estate",
  heroSubtitle: 'As a Realtor for 17 years, I have heard all of the reasons why not to buy real estate ranging from it being too expensive to my 11-year-old daughter doesn\'t like it. All were valid reasons for those clients, but most regretted the decision. Once the decision is made to buy real estate, then the Where, What, and With Whom are the key questions that need answers before moving forward.',
  sections: [
    {
      title: "Where To Buy",
      text: 'People not familiar with the Aspen Snowmass call me and say, "Hi Stacey, I am looking for a mountain home. I want to have great skiing, fun summer activities, and possibly some water nearby. I also want it to be easy to get to and have opportunities to enjoy some culture in a community." They laugh when I say, "Yes". Aspen, Snowmass and the Roaring Fork Valley truly has all of the above. The world-class skiing on 4 unique mountains offers skiing for every ability with minimal lift lines. Winter is the time when most are introduced to this area, but they stay for the summers that are filled with beautiful weather, bike rides, fly fishing, hiking trails, and golf with gorgeous scenery at every tee. There are literally events happening every day in the summer including The Ideas Festival, Jazz Aspen Music Festival, Ragnar Relays, and Theatre Aspen.\n\nI have had the fortune of growing up in Jackson Hole and Utah, living in the Vail Valley and North Lake Tahoe, and visiting 75% of the mountain resorts in the area. I have investigated all of these communities and keep coming back to the Roaring Fork Valley as the best fit for me and my family. Winning the lottery tomorrow may change my tax bracket, but not my zip code!',
      ctaText: "Search Properties",
      ctaLink: "/listings",
    },
    {
      title: "What To Buy",
      text: "Buying and selling real estate is 30% about doors, foundations, and investment returns. The other 70% is about the heart. Buyers can analyze, diagram, and reason any property to make what their heart's desire the \"smartest decision I ever made.\" Seeing property is the best way to make the decision even easier.\n\nJust like the four mountains of Aspen Skiing Company, the Aspen Snowmass real estate market has something for everyone. A pied-a-terre walking distance to coffee shops and hiking trails to a sprawling ranch with private fishing ponds can both be found in 30 miles of each other.\n\nClick on the link below to search MLS listings in the Aspen Glenwood MLS.",
      ctaText: "Search Aspen MLS",
      ctaLink: "/listings",
    },
    {
      title: "Who To Trust With Real Estate",
      text: "Real estate agents play an important role in the buying and selling of homes. They are responsible for helping clients navigate the process of finding the perfect home and negotiating a fair deal.\n\nSo what makes a great real estate agent? A great real estate agent is one who takes the time to understand the needs of their clients, whether they're looking for a new primary residence, or an investment property. A great agent will have strong connections within the industry, which will give them access to more options than what's available on the open market.\n\nAnother important trait of a successful real estate agent is having excellent negotiation skills. They should be able to get their clients the best possible price while also keeping everyone happy in the transaction.\n\nFinally, it's essential that a great real estate agent has impeccable communication skills. Clients need to be kept regularly updated on any developments in their search, so clear communication is key. An effective real estate agent should also be able to answer questions quickly and accurately, as well as provide support when needed.\n\nIf you're looking for a skilled real estate agent who possesses these traits, you can rest assured that your home-buying experience will be smooth and stress-free!",
    },
  ],
  ctaTitle: "Ready to Find Your Dream Home?",
  ctaSubtitle: "Let's start your home search today. Contact us for a free buyer consultation and take the first step toward homeownership.",
  ctaButtonText: "Contact Us",
  ctaButtonLink: "/contact-us",
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch<SanityDocument>(BUY_PAGE_QUERY, {}, options);

  const metaTitle = data?.seo?.metaTitle || data?.heroTitle || defaults.heroTitle;
  const metaDescription = data?.seo?.metaDescription || 'Your guide to buying real estate in Aspen, Snowmass, and the Roaring Fork Valley.';
  const ogImageUrl = data?.seo?.ogImage
    ? urlFor(data.seo.ogImage)?.width(1200).height(630).url()
    : data?.heroImage
    ? urlFor(data.heroImage)?.width(1200).height(630).url()
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `${baseUrl}/buy`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      url: `${baseUrl}/buy`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">{children}</p>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white mt-8 mb-4 tracking-wide">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl md:text-2xl font-serif font-light text-[#1a1a1a] dark:text-white mt-6 mb-3 tracking-wide">{children}</h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-[var(--color-gold)] pl-6 my-8 italic text-[#5a5a5a] dark:text-gray-400 font-serif text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-medium text-[#1a1a1a] dark:text-white">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic font-serif">{children}</em>,
  },
};

export default async function BuyPage() {
  const data = await client.fetch<SanityDocument>(BUY_PAGE_QUERY, {}, options);

  const heroTitle = data?.heroTitle || defaults.heroTitle;
  const heroSubtitle = data?.heroSubtitle || defaults.heroSubtitle;
  const heroImageUrl = data?.heroImage
    ? urlFor(data.heroImage)?.width(1920).height(800).url()
    : null;

  const sections = data?.sections?.length > 0 ? data.sections : null;
  const faqs = data?.faqs?.length > 0 ? data.faqs : null;
  const faqTitle = data?.faqTitle || 'Frequently Asked Questions';

  const ctaTitle = data?.ctaTitle || defaults.ctaTitle;
  const ctaSubtitle = data?.ctaSubtitle || defaults.ctaSubtitle;
  const ctaButtonText = data?.ctaButtonText || defaults.ctaButtonText;
  const ctaButtonLink = data?.ctaButtonLink || defaults.ctaButtonLink;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] min-h-[500px] flex items-end">
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={heroTitle}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-navy)]" />
        )}

        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
          <h1 className="font-serif text-white mb-4 max-w-4xl">
            {heroTitle}
          </h1>
        </div>
      </section>

      {/* Hero Subtitle / Intro Paragraph */}
      {heroSubtitle && (
        <section className="py-16 md:py-20 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <p className="text-lg md:text-xl text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-center">
              {heroSubtitle}
            </p>
          </div>
        </section>
      )}

      {/* Content Sections from Sanity */}
      {sections ? (
        sections.map((section: any, index: number) => {
          const isEven = index % 2 === 0;
          const hasImage = !!section.image;
          const imageOnLeft = section.imagePosition === 'left';
          const sectionImageUrl = section.image
            ? urlFor(section.image)?.width(800).height(600).url()
            : null;

          return (
            <section
              key={index}
              className={`py-16 md:py-20 ${isEven ? 'bg-[#f8f7f5] dark:bg-[#141414]' : 'bg-white dark:bg-[#1a1a1a]'}`}
            >
              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
                {hasImage ? (
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
                    <div className={imageOnLeft ? 'lg:order-2' : ''}>
                      <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                        {section.title}
                      </h2>
                      {section.content && (
                        <div className="prose prose-lg max-w-none">
                          <PortableText value={section.content} components={portableTextComponents} />
                        </div>
                      )}
                      {section.ctaText && section.ctaLink && (
                        <div className="mt-8">
                          <Link
                            href={section.ctaLink}
                            className="inline-flex items-center gap-3 px-8 py-3 bg-transparent border border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                          >
                            {section.ctaText}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className={`relative aspect-[4/3] ${imageOnLeft ? 'lg:order-1' : ''}`}>
                      <Image
                        src={sectionImageUrl || ''}
                        alt={section.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                      {section.title}
                    </h2>
                    {section.content && (
                      <div className="prose prose-lg max-w-none">
                        <PortableText value={section.content} components={portableTextComponents} />
                      </div>
                    )}
                    {section.ctaText && section.ctaLink && (
                      <div className="mt-8">
                        <Link
                          href={section.ctaLink}
                          className="inline-flex items-center gap-3 px-8 py-3 bg-transparent border border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                        >
                          {section.ctaText}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })
      ) : (
        /* Default content sections when no Sanity data */
        defaults.sections.map((section, index) => {
          const isEven = index % 2 === 0;

          return (
            <section
              key={index}
              className={`py-16 md:py-20 ${isEven ? 'bg-[#f8f7f5] dark:bg-[#141414]' : 'bg-white dark:bg-[#1a1a1a]'}`}
            >
              <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-8 tracking-wide">
                  {section.title}
                </h2>
                {section.text.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-6 text-[#4a4a4a] dark:text-gray-300 leading-[1.8] font-light text-[17px]">
                    {paragraph}
                  </p>
                ))}
                {section.ctaText && section.ctaLink && (
                  <div className="mt-8">
                    <Link
                      href={section.ctaLink}
                      className="inline-flex items-center gap-3 px-8 py-3 bg-transparent border border-[var(--color-gold)] text-[#1a1a1a] dark:text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                    >
                      {section.ctaText}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </section>
          );
        })
      )}

      {/* FAQ Section (only if Sanity data exists) */}
      {faqs && faqs.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-12 text-center">
              {faqTitle}
            </h2>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative py-20 md:py-28">
        {data?.ctaImage ? (
          <>
            <Image
              src={urlFor(data.ctaImage)?.width(1920).height(600).url() || ''}
              alt="Get Started"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[var(--color-navy)]/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-navy)]" />
        )}

        <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            {ctaTitle}
          </h2>
          {ctaSubtitle && (
            <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              {ctaSubtitle}
            </p>
          )}
          {ctaButtonText && (
            <Link
              href={ctaButtonLink}
              className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)] transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              {ctaButtonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
