import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Partner, enrichPartnerWithAgentData } from "../../components";
import { getSiteName, getBaseUrl } from "@/lib/settings";
import { formatPhone, phoneHref } from '@/lib/phoneUtils';
import { getRealogyListingsByAgentName, formatPrice, toAddressSlug } from '@/lib/listings';

// Query by slug or by generated slug from firstName-lastName
const PARTNER_BY_SLUG_QUERY = `*[_type == "affiliatedPartner" && active == true && partnerType == "market_leader" && (slug.current == $slug || lower(firstName + "-" + lastName) == $slug)][0] {
  _id,
  partnerType,
  firstName,
  lastName,
  agentStaffId,
  slug,
  title,
  company,
  location,
  email,
  phone,
  website,
  overridePhoto,
  overrideBio,
  specialties,
  featured
}`;

const options = { next: { revalidate: 60 } };

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const partner = await client.fetch<Partner | null>(PARTNER_BY_SLUG_QUERY, { slug }, options);

  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);

  if (!partner) {
    return {
      title: `Partner Not Found | ${siteName}`,
    };
  }

  const canonicalUrl = `${baseUrl}/affiliated-partners/market-leaders/${slug}`;

  return {
    title: `${partner.firstName} ${partner.lastName} | Market Leader | ${siteName}`,
    description: `Meet ${partner.firstName} ${partner.lastName}${partner.company ? ` of ${partner.company}` : ''}${partner.location ? ` in ${partner.location}` : ''}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${partner.firstName} ${partner.lastName} | Market Leader | ${siteName}`,
      description: `Meet ${partner.firstName} ${partner.lastName}${partner.company ? ` of ${partner.company}` : ''}${partner.location ? ` in ${partner.location}` : ''}.`,
      url: canonicalUrl,
    },
  };
}

export default async function MarketLeaderPartnerPage({ params }: Props) {
  const { slug } = await params;
  const partner = await client.fetch<Partner | null>(PARTNER_BY_SLUG_QUERY, { slug }, options);

  if (!partner) {
    notFound();
  }

  const enrichedPartner = await enrichPartnerWithAgentData(partner);

  // Fetch agent listings from Realogy, filter out those with broken photos
  const agentName = `${partner.firstName} ${partner.lastName}`;
  const rawListings = await getRealogyListingsByAgentName(agentName);
  const activeListings = rawListings.activeListings;
  const soldListings = rawListings.soldListings;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-navy)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Breadcrumb */}
          <div className="mb-8 text-center">
            <Link href="/affiliated-partners" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Affiliated Partners
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/affiliated-partners/market-leaders" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Market Leaders
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">{enrichedPartner.firstName} {enrichedPartner.lastName}</span>
          </div>

          <div className="flex flex-col items-center">
            {/* Photo */}
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden mb-8 bg-[#f0f0f0] dark:bg-gray-800 border-4 border-[var(--color-gold)]/30">
              {enrichedPartner.photoUrl ? (
                <Image
                  src={enrichedPartner.photoUrl}
                  alt={`${enrichedPartner.firstName} ${enrichedPartner.lastName}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#aaa] dark:text-gray-600">
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name & Title */}
            <h1 className="font-serif text-white mb-3 text-center">
              {enrichedPartner.firstName} {enrichedPartner.lastName}
            </h1>
            {enrichedPartner.title && (
              <p className="text-[var(--color-gold)] text-lg font-light mb-2">
                {enrichedPartner.title}
              </p>
            )}
            {enrichedPartner.company && (
              <p className="text-white/70 text-base font-light mb-1">
                {enrichedPartner.company}
              </p>
            )}
            {enrichedPartner.location && (
              <p className="text-white/50 text-base font-light">
                {enrichedPartner.location}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Bio */}
          {enrichedPartner.bio && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
                About {enrichedPartner.firstName}
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed whitespace-pre-line">
                  {enrichedPartner.bio}
                </p>
              </div>
            </div>
          )}

          {/* Specialties */}
          {enrichedPartner.specialties && enrichedPartner.specialties.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
                Specialties
              </h2>
              <div className="flex flex-wrap gap-3">
                {enrichedPartner.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-[#f8f7f5] dark:bg-[#252525] text-[#4a4a4a] dark:text-gray-300 text-sm font-light"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(enrichedPartner.email || enrichedPartner.phone || enrichedPartner.website) && (
            <div className="mb-12">
              <h2 className="text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6">
                Contact
              </h2>
              <div className="space-y-4">
                {enrichedPartner.email && (
                  <a
                    href={`mailto:${enrichedPartner.email}`}
                    className="flex items-center gap-4 text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f8f7f5] dark:bg-[#252525] flex items-center justify-center group-hover:bg-[var(--color-gold)]/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-light">{enrichedPartner.email}</span>
                  </a>
                )}
                {enrichedPartner.phone && (
                  <a
                    href={`tel:${phoneHref(enrichedPartner.phone)}`}
                    className="flex items-center gap-4 text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f8f7f5] dark:bg-[#252525] flex items-center justify-center group-hover:bg-[var(--color-gold)]/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="font-light">{formatPhone(enrichedPartner.phone)}</span>
                  </a>
                )}
                {enrichedPartner.website && (
                  <a
                    href={enrichedPartner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-[#4a4a4a] dark:text-gray-300 hover:text-[var(--color-gold)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f8f7f5] dark:bg-[#252525] flex items-center justify-center group-hover:bg-[var(--color-gold)]/10 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <span className="font-light">Visit Website</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Listings */}
      {activeListings.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Active Listings
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-10">
              {activeListings.length} {activeListings.length === 1 ? 'property' : 'properties'} currently for sale
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {activeListings.slice(0, 12).map((listing) => (
                <div key={listing.id} className="group border border-gray-200 overflow-hidden">
                  <Link href={`/affiliated-partners/market-leaders/listings/${toAddressSlug(listing.address)}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-taupe)]">
                      {listing.photos?.[0] ? (
                        <Image
                          src={listing.photos[0]}
                          alt={listing.address || 'Property'}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-gray-900 font-semibold" style={{ fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                      {formatPrice(listing.list_price)}
                    </h3>
                    <p className="leading-snug line-clamp-1 text-sm text-gray-700" style={{ marginBottom: '0.125rem' }}>
                      {listing.address}
                    </p>
                    <p className="leading-snug line-clamp-1 text-xs text-gray-500" style={{ marginBottom: '0.5rem' }}>
                      {listing.city}, {listing.state}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] uppercase text-gray-500 tracking-wider">
                      {listing.bedrooms != null && <span>{listing.bedrooms} Beds</span>}
                      {listing.bedrooms != null && listing.bathrooms != null && <span className="w-px h-3 bg-gray-300" />}
                      {listing.bathrooms != null && <span>{listing.bathrooms} Baths</span>}
                      {listing.bathrooms != null && listing.square_feet != null && <span className="w-px h-3 bg-gray-300" />}
                      {listing.square_feet != null && <span>{listing.square_feet.toLocaleString()} SF</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sold Listings */}
      {soldListings.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              Recently Sold
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light mb-10">
              {soldListings.length} {soldListings.length === 1 ? 'property' : 'properties'} recently sold
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:grid-cols-3">
              {soldListings.slice(0, 12).map((listing) => (
                <div key={listing.id} className="group border border-gray-200 overflow-hidden">
                  <Link href={`/affiliated-partners/market-leaders/listings/${toAddressSlug(listing.address)}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-taupe)]">
                      {listing.photos?.[0] ? (
                        <Image
                          src={listing.photos[0]}
                          alt={listing.address || 'Property'}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale-[30%]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-[var(--color-sand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-[#8a8a8a] text-white">
                          Sold
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-gray-900 font-semibold" style={{ fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                      {formatPrice(listing.sold_price || listing.list_price)}
                    </h3>
                    <p className="leading-snug line-clamp-1 text-sm text-gray-700" style={{ marginBottom: '0.125rem' }}>
                      {listing.address}
                    </p>
                    <p className="leading-snug line-clamp-1 text-xs text-gray-500" style={{ marginBottom: '0.5rem' }}>
                      {listing.city}, {listing.state}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] uppercase text-gray-500 tracking-wider">
                      {listing.bedrooms != null && <span>{listing.bedrooms} Beds</span>}
                      {listing.bedrooms != null && listing.bathrooms != null && <span className="w-px h-3 bg-gray-300" />}
                      {listing.bathrooms != null && <span>{listing.bathrooms} Baths</span>}
                      {listing.bathrooms != null && listing.square_feet != null && <span className="w-px h-3 bg-gray-300" />}
                      {listing.square_feet != null && <span>{listing.square_feet.toLocaleString()} SF</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back Navigation */}
      <section className="py-12 bg-[#f8f7f5] dark:bg-[#141414] border-t border-[#e8e6e3] dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <Link
            href="/affiliated-partners/market-leaders"
            className="inline-flex items-center gap-3 text-[#1a1a1a] dark:text-white hover:text-[var(--color-gold)] transition-colors text-sm font-light"
          >
            <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Back to Market Leaders
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-[var(--color-navy)]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            Interested in Working Together?
          </h2>
          <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with {enrichedPartner.firstName} to explore real estate opportunities in {enrichedPartner.location || 'their market'}.
          </p>
          {enrichedPartner.email ? (
            <a
              href={`mailto:${enrichedPartner.email}`}
              className="klug-hero-btn sir-btn sir-btn--light inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-white transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              Get in Touch
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          ) : (
            <Link
              href="/contact-us"
              className="klug-hero-btn sir-btn sir-btn--light inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white hover:bg-[var(--color-gold)] hover:text-white transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
            >
              Contact Us
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
