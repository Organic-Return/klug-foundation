import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteTemplate, getSiteName, getBaseUrl, getDefaultHeroImageUrl } from "@/lib/settings";
import TeamGrid from "@/components/TeamGrid";
import { phoneHref, formatPhone } from "@/lib/phoneUtils";
import { htmlToPlainText, splitParagraphs } from "@/lib/textUtils";

const builder = createImageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  bio?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
}

interface TeamPageDoc {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: { asset?: { url?: string } };
  stats?: Array<{ value?: string; label?: string }>;
  membersSectionTitle?: string;
  philosophyTitle?: string;
  philosophyContent?: string;
  philosophyImage?: any;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: { url?: string } };
  };
}

const ALL_TEAM_QUERY = `*[_type == "teamMember" && defined(slug.current) && inactive != true && defined(title) && title != ""] | order(order asc, name asc) {
  _id,
  name,
  slug,
  title,
  bio,
  image,
  email,
  phone,
  mobile,
  office
}`;

const TEAM_PAGE_QUERY = `*[_type == "teamPage" && _id == "teamPage"][0]{
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroImage { asset->{ url } },
  stats[]{ value, label },
  membersSectionTitle,
  philosophyTitle,
  philosophyContent,
  philosophyImage,
  ctaTitle,
  ctaDescription,
  ctaButtonLabel,
  ctaButtonHref,
  seo {
    metaTitle,
    metaDescription,
    ogImage { asset->{ url } }
  }
}`;

const options = { next: { revalidate: 30 } };

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName, page] = await Promise.all([
    getBaseUrl(),
    getSiteName(),
    client.fetch<TeamPageDoc | null>(TEAM_PAGE_QUERY, {}, options),
  ]);
  const isRCTemplate = process.env.NEXT_PUBLIC_SITE_TEMPLATE === 'rcsothebys-custom';
  const path = isRCTemplate ? 'agents' : 'team';
  const heroTitle = page?.heroTitle || (isRCTemplate ? 'Our Agents' : 'Our Team');
  const title = page?.seo?.metaTitle || `${heroTitle} | ${siteName}`;
  const description = page?.seo?.metaDescription
    || page?.heroDescription
    || `Meet the experienced real estate professionals at ${siteName}.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${path}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${path}`,
    },
  };
}

export default async function TeamPage() {
  const [members, template, page, defaultHeroUrl] = await Promise.all([
    client.fetch<TeamMember[]>(ALL_TEAM_QUERY, {}, options),
    getSiteTemplate(),
    client.fetch<TeamPageDoc | null>(TEAM_PAGE_QUERY, {}, options),
    getDefaultHeroImageUrl(),
  ]);

  const isRC = template === "rcsothebys-custom";

  // Process image URLs server-side for the client component
  const processedMembers = members.map((m) => ({
    _id: m._id,
    name: m.name,
    slug: m.slug,
    title: m.title?.replace(/\bResidential\b/g, 'Real Estate Broker'),
    email: m.email,
    phone: m.phone,
    mobile: m.mobile,
    office: m.office,
    imageUrl: m.image
      ? isRC
        ? urlFor(m.image).width(450).height(560).url()
        : urlFor(m.image).width(300).height(300).url()
      : undefined,
  }));

  // RC Sotheby's variant — letter-filtered grid (unchanged)
  if (isRC) {
    return (
      <main className="-mt-20 min-h-screen">
        <section className="rc-inverted bg-[var(--rc-navy)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
              style={{ fontFamily: "var(--font-figtree), Figtree, sans-serif", lineHeight: "1.1em" }}
            >
              Retter &amp; Company Sotheby&apos;s International Realty Team
            </h1>
            <p className="text-white/60 text-base md:text-lg font-normal max-w-2xl mx-auto">
              Meet our Experienced Tri-Cities Real Estate Agents
            </p>
          </div>
        </section>
        <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
          <div className="max-w-7xl mx-auto px-6">
            <TeamGrid members={processedMembers} isRC={true} totalCount={members.length} />
          </div>
        </section>
      </main>
    );
  }

  // Klug / non-RC editorial variant — hero, stats, alternating member sections,
  // philosophy block, parallax CTA. Driven by the teamPage singleton in Sanity.
  const heroTitle = page?.heroTitle || 'Our Team';
  const heroDescription = page?.heroDescription
    || 'Three full-time licensed real estate professionals born and raised in Colorado and the Roaring Fork Valley with over 25 years of combined real estate success and over $1 billion in career sales. We love this community and what we do, and we are passionate about sharing it and giving back through the Chris Klug Foundation and other local non-profits we support, such as the Aspen Center for Environmental Studies, Independence Pass Foundation, and Aspen Cycling Club.';
  const heroImageRaw = page?.heroImage?.asset?.url || defaultHeroUrl;
  const stats = page?.stats?.filter((s) => s?.value) || [];
  const philosophyTitle = page?.philosophyTitle;
  const philosophyContent = page?.philosophyContent;
  const philosophyImageUrl = page?.philosophyImage
    ? urlFor(page.philosophyImage).width(1200).height(800).url()
    : null;
  const ctaTitle = page?.ctaTitle || 'Work With the Team';
  const ctaDescription = page?.ctaDescription
    || 'Whether you are buying or selling, the Klug Properties team is ready to help you make the most of the Roaring Fork Valley market.';
  const ctaButtonLabel = page?.ctaButtonLabel || 'Contact Us';
  const ctaButtonHref = page?.ctaButtonHref || '/contact-us';

  // Editorial member rendering uses a larger headshot and the bio
  const editorialMembers = members.map((m) => ({
    _id: m._id,
    name: m.name,
    slug: m.slug,
    title: m.title?.replace(/\bResidential\b/g, 'Real Estate Broker'),
    bio: htmlToPlainText(m.bio),
    email: m.email,
    phone: m.phone || m.mobile,
    imageUrl: m.image ? urlFor(m.image).width(720).height(900).url() : undefined,
  }));

  return (
    // -mt-20 pulls the hero up under the transparent header — required for
    // pages on LayoutWrapper.tsx's hasTransparentHero list, otherwise the
    // outer <main className="pt-20"> leaves an 80px white band that the
    // transparent header sits on top of and disappears against.
    <main className="-mt-20 min-h-screen">
      {/* Hero — transparent header sits on top, so add extra top padding.
          Always paint the dark navy as the base so the white logo + title
          stay readable while the hero image is loading or if it fails. */}
      <section className="relative pt-36 pb-2 md:pt-44 md:pb-2 bg-[var(--color-sothebys-blue)]">
        {heroImageRaw && (
          <>
            <Image
              src={heroImageRaw}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              quality={95}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-transparent to-[#1a1a1a]/80" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/30 via-transparent to-[#1a1a1a]/30" aria-hidden="true" />
            <div
              className="absolute inset-0 bg-[var(--color-sothebys-blue)]/70"
              aria-hidden="true"
            />
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h1 className="font-serif text-white mb-6">
            {heroTitle}
          </h1>
          <div className="w-12 h-px bg-[var(--color-gold)] mx-auto mb-8" />
          {/* [&>p]:mx-auto centers each <p> block within the centered
              container — globals.css caps p at max-width: 75ch, so without
              auto margins the block sits flush-left even when its parent
              has text-center. */}
          <div className="space-y-4 text-lg md:text-xl text-white/80 font-light leading-relaxed [&>p]:mx-auto">
            {splitParagraphs(heroDescription).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      {stats.length > 0 && (
        <section className="bg-white dark:bg-[#1a1a1a] border-b border-[#e8e6e3] dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16">
            <div className={`grid gap-8 md:gap-12 ${stats.length === 4 ? 'grid-cols-2 md:grid-cols-4' : stats.length === 3 ? 'grid-cols-1 md:grid-cols-3' : stats.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)] mb-3 leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[#6a6a6a] dark:text-gray-400 text-xs md:text-sm uppercase tracking-[0.2em] font-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Members — alternating editorial layout */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="space-y-20 md:space-y-32">
            {editorialMembers.map((m, i) => {
              const photoLeft = i % 2 === 0;
              return (
                <article
                  key={m._id}
                  className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center"
                >
                  {/* Headshot */}
                  <div className={`relative aspect-[4/5] w-full bg-[#f0f0f0] dark:bg-gray-800 ${photoLeft ? 'md:order-1' : 'md:order-2'}`}>
                    {m.imageUrl ? (
                      <Image
                        src={m.imageUrl}
                        alt={m.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#aaa] dark:text-gray-600">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Bio + contact */}
                  <div className={photoLeft ? 'md:order-2' : 'md:order-1'}>
                    <div className="md:border-l md:border-[var(--color-gold)] md:pl-8 lg:pl-12">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-2">
                        {m.name}
                      </h2>
                      {m.title && (
                        <p className="text-[var(--color-gold)] text-sm md:text-base uppercase tracking-[0.18em] font-light mb-6">
                          {m.title}
                        </p>
                      )}
                      {m.bio && (
                        <div className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8] text-[16px] md:text-[17px] space-y-4 mb-8 line-clamp-6">
                          {splitParagraphs(m.bio).map((para, j) => (
                            <p key={j}>{para}</p>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 text-sm">
                        {m.phone && (
                          <a
                            href={`tel:${phoneHref(m.phone)}`}
                            className="inline-flex items-center gap-2 text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="font-light">{formatPhone(m.phone)}</span>
                          </a>
                        )}
                        {m.email && (
                          <a
                            href={`mailto:${m.email}`}
                            className="inline-flex items-center gap-2 text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors break-all"
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-light">{m.email}</span>
                          </a>
                        )}
                      </div>

                      <Link
                        href={`/real-estate-agent/${m.slug.current}`}
                        className="inline-flex items-center gap-3 text-[var(--color-sothebys-blue)] dark:text-[var(--color-gold)] text-[11px] uppercase tracking-[0.25em] font-light border-b border-[var(--color-gold)]/40 pb-1 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-colors"
                      >
                        Full Bio &amp; Listings
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy / Giving Back */}
      {(philosophyTitle || philosophyContent) && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className={`grid grid-cols-1 ${philosophyImageUrl ? 'lg:grid-cols-2 gap-12 lg:gap-20 items-center' : 'max-w-3xl mx-auto text-center'}`}>
              <div>
                {philosophyTitle && (
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
                    {philosophyTitle}
                  </h2>
                )}
                <div className={`${philosophyImageUrl ? '' : 'mx-auto'} w-12 h-px bg-[var(--color-gold)] mb-6`} />
                {philosophyContent && (
                  // [&>p]:mx-auto centers the <p> blocks when this column is
                  // the no-image, centered variant (globals.css caps p at
                  // 75ch, so without auto margins the blocks sit flush-left
                  // even inside a text-center parent). When the philosophy
                  // image IS set the parent is left-aligned editorial and
                  // mx-auto has no visible effect there.
                  <div className="text-[#4a4a4a] dark:text-gray-300 font-light leading-[1.8] text-[17px] space-y-4 [&>p]:mx-auto">
                    {splitParagraphs(philosophyContent).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
              </div>
              {philosophyImageUrl && (
                <div className="relative aspect-[4/3]">
                  <Image
                    src={philosophyImageUrl}
                    alt={philosophyTitle || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 600px"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Contact CTA — parallax matches other landing pages */}
      <section className="relative py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a] overflow-hidden">
        {heroImageRaw && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-fixed"
              style={{ backgroundImage: `url(${heroImageRaw})` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[var(--color-sothebys-blue)]/70 dark:bg-black/70"
              aria-hidden="true"
            />
          </>
        )}
        <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            {ctaTitle}
          </h2>
          <div className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed space-y-3 [&>p]:mx-auto">
            {splitParagraphs(ctaDescription).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <Link
            href={ctaButtonHref}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            {ctaButtonLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
