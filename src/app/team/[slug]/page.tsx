import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListingsByAgentId } from "@/lib/listings";
import { getSiteTemplate } from "@/lib/settings";
import AgentListingsGrid from "@/components/AgentListingsGrid";
import AgentHeroGallery from "@/components/AgentHeroGallery";
import AgentContactForm from "@/components/AgentContactForm";

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
  address?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  mlsAgentId?: string;
  mlsAgentIdSold?: string;
}

const TEAM_MEMBER_QUERY = `*[_type == "teamMember" && slug.current == $slug && inactive != true][0] {
  _id,
  name,
  slug,
  title,
  bio,
  image,
  email,
  phone,
  mobile,
  office,
  address,
  socialMedia,
  mlsAgentId,
  mlsAgentIdSold
}`;

const options = { next: { revalidate: 60 } };

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await client.fetch<TeamMember | null>(TEAM_MEMBER_QUERY, { slug }, options);

  if (!member) {
    return { title: 'Team Member Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const canonicalUrl = `${baseUrl}/team/${slug}`;

  return {
    title: `${member.name}${member.title ? ` | ${member.title}` : ''} | Klug Properties`,
    description: member.bio ? member.bio.slice(0, 160) : `Meet ${member.name} at Klug Properties.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${member.name} | Klug Properties`,
      description: member.bio ? member.bio.slice(0, 160) : `Meet ${member.name} at Klug Properties.`,
      url: canonicalUrl,
    },
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const { slug } = await params;
  const [member, template] = await Promise.all([
    client.fetch<TeamMember | null>(TEAM_MEMBER_QUERY, { slug }, options),
    getSiteTemplate(),
  ]);

  if (!member) {
    notFound();
  }

  const isRC = template === "rcsothebys-custom";
  const agentListings = await getListingsByAgentId(member.mlsAgentId || null, member.mlsAgentIdSold, member.name);

  const hasListings = agentListings && (agentListings.activeListings.length > 0 || agentListings.soldListings.length > 0);

  // For RC template: filter active listings that have photos for the hero gallery
  const heroListings = isRC && agentListings
    ? agentListings.activeListings
        .filter((l) => l.photos && l.photos.length > 0)
        .map((l) => ({
          id: String(l.id),
          address: l.address || '',
          city: l.city || '',
          state: l.state || undefined,
          list_price: l.list_price || 0,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          square_feet: l.square_feet,
          photos: l.photos,
          status: l.status || undefined,
        }))
    : [];
  const showHeroGallery = isRC && heroListings.length > 0;

  const agentImageUrl = member.image
    ? urlFor(member.image).width(450).height(560).url()
    : undefined;

  return (
    <main className="min-h-screen">
      {/* Hero Gallery (RC with active listings) or Standard Hero */}
      {showHeroGallery ? (
        <>
          <AgentHeroGallery listings={heroListings} />

          {/* Agent Profile Section — photo left, info right */}
          <section className="rc-inverted bg-[var(--rc-navy)] py-16 md:py-20">
            <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
              <div className="flex flex-col md:flex-row gap-10 md:gap-14">
                {/* Agent Photo */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div
                    className="relative w-[250px] md:w-[300px] overflow-hidden bg-white/5"
                    style={{ aspectRatio: '450 / 560' }}
                  >
                    {member.image ? (
                      <Image
                        src={agentImageUrl!}
                        alt={member.name}
                        fill
                        className="object-cover"
                        priority
                        sizes="300px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-2"
                    style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                  >
                    {member.name}
                  </h1>
                  {member.title && (
                    <p className="text-[var(--rc-gold)] text-base md:text-lg font-light mb-6">
                      {member.title}
                    </p>
                  )}

                  {/* Contact details */}
                  <div className="space-y-2 mb-6">
                    {member.mobile && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm w-6">C:</span>
                        <a href={`tel:${member.mobile}`} className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                          {member.mobile}
                        </a>
                      </div>
                    )}
                    {(member.office || member.phone) && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm w-6">O:</span>
                        <a href={`tel:${member.office || member.phone}`} className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                          {member.office || member.phone}
                        </a>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <a href={`mailto:${member.email}`} className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                          {member.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Social media */}
                  {member.socialMedia && (
                    <div className="flex items-center gap-4 mb-8">
                      {member.socialMedia.facebook && (
                        <a href={member.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>
                      )}
                      {member.socialMedia.instagram && (
                        <a href={member.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                        </a>
                      )}
                      {member.socialMedia.linkedin && (
                        <a href={member.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                      )}
                      {member.socialMedia.twitter && (
                        <a href={member.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--rc-gold)] transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Contact button */}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border border-[var(--rc-gold)] text-white text-xs uppercase tracking-[0.2em] font-light hover:bg-[var(--rc-gold)] hover:text-[var(--rc-navy)] transition-all duration-300"
                    >
                      Contact {member.name.split(' ')[0]}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Bio — full width below profile */}
              {member.bio && (
                <div className="mt-12 md:mt-16 pt-10 border-t border-white/10">
                  <h2
                    className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-white mb-6"
                    style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                  >
                    About {member.name.split(' ')[0]}
                  </h2>
                  <div
                    className="prose prose-lg max-w-none font-light leading-relaxed [&_*]:text-white/80 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_a]:!text-[var(--rc-gold)] [&_a]:underline hover:[&_a]:opacity-80"
                    dangerouslySetInnerHTML={{ __html: member.bio }}
                  />
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
      <>
      <section className={`relative py-16 md:py-24 ${isRC ? 'rc-inverted bg-[var(--rc-navy)]' : 'bg-[var(--color-navy)]'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Breadcrumb */}
          <div className="mb-8 text-center">
            <Link href="/" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Home
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <Link href="/team" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">
              Team
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-white/80 text-sm font-light">{member.name}</span>
          </div>

          <div className="flex flex-col items-center">
            {/* Photo */}
            {isRC ? (
              <div
                className="relative w-[225px] md:w-[300px] overflow-hidden mb-8 bg-[var(--rc-navy)]/50"
                style={{ aspectRatio: '450 / 560' }}
              >
                {member.image ? (
                  <Image
                    src={urlFor(member.image).width(450).height(560).url()}
                    alt={member.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--rc-brown)]/30">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden mb-8 bg-[#f0f0f0] dark:bg-gray-800 border-4 border-[var(--color-gold)]/30">
                {member.image ? (
                  <Image
                    src={urlFor(member.image).width(400).height(400).url()}
                    alt={member.name}
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
            )}

            {/* Name & Title */}
            <h1
              className={`text-white mb-3 text-center ${
                isRC
                  ? 'text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em]'
                  : 'font-serif'
              }`}
              style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' } : undefined}
            >
              {member.name}
            </h1>
            {member.title && (
              <p className={`text-lg font-light mb-4 ${isRC ? 'text-[var(--rc-gold)]' : 'text-[var(--color-gold)]'}`}>
                {member.title}
              </p>
            )}

            {/* Contact row */}
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {member.email && (
                <a href={`mailto:${member.email}`} className="text-white/70 hover:text-white text-sm font-light transition-colors">
                  {member.email}
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className="text-white/70 hover:text-white text-sm font-light transition-colors">
                  {member.phone}
                </a>
              )}
              {member.mobile && member.mobile !== member.phone && (
                <a href={`tel:${member.mobile}`} className="text-white/70 hover:text-white text-sm font-light transition-colors">
                  {member.mobile}
                </a>
              )}
            </div>

            {/* Social media */}
            {member.socialMedia && (
              <div className="flex items-center gap-4 mt-6">
                {member.socialMedia.facebook && (
                  <a href={member.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                )}
                {member.socialMedia.instagram && (
                  <a href={member.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  </a>
                )}
                {member.socialMedia.linkedin && (
                  <a href={member.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                )}
                {member.socialMedia.twitter && (
                  <a href={member.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bio Section */}
      {member.bio && (
        <section className={`py-16 md:py-24 ${isRC ? 'rc-inverted bg-[var(--rc-navy)]' : 'bg-white dark:bg-[#1a1a1a]'}`}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <h2
              className={
                isRC
                  ? 'text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-white mb-6'
                  : 'text-2xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-6'
              }
              style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
            >
              About {member.name.split(' ')[0]}
            </h2>
            <div
              className={`prose prose-lg max-w-none font-light leading-relaxed ${
                isRC
                  ? '[&_*]:text-white/80 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_strong]:text-white [&_a]:!text-[var(--rc-gold)] [&_a]:underline hover:[&_a]:opacity-80'
                  : 'dark:prose-invert text-[#4a4a4a] dark:text-gray-300 [&_a]:text-[var(--color-gold)] [&_a]:underline hover:[&_a]:opacity-80'
              }`}
              dangerouslySetInnerHTML={{ __html: member.bio }}
            />
          </div>
        </section>
      )}
      </>
      )}

      {/* Agent Stats (non-RC only) */}
      {!isRC && agentListings && agentListings.soldListings.length > 0 && (() => {
        const totalSold = agentListings.soldListings.length;
        const totalVolume = agentListings.soldListings.reduce((sum, listing) => sum + (listing.sold_price || listing.list_price || 0), 0);
        return (
          <section className="py-12 md:py-16 bg-[#f8f7f5] dark:bg-[#141414]">
            <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                    {totalSold}
                  </p>
                  <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                    Properties Sold
                  </p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-light mb-2 font-serif text-[#1a1a1a] dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalVolume)}
                  </p>
                  <p className="text-sm uppercase tracking-[0.15em] font-light text-[#6a6a6a] dark:text-gray-400">
                    Total Sales Volume
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Listings Section */}
      {hasListings && agentListings && (
        <section className={`py-16 md:py-24 ${isRC ? 'bg-[var(--rc-cream)]' : 'bg-[#f8f7f5] dark:bg-[#141414]'}`}>
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
            <h2
              className={`text-3xl md:text-4xl font-light tracking-wide mb-4 text-center ${
                isRC ? 'uppercase tracking-[0.08em] text-[var(--rc-navy)]' : 'font-serif text-[#1a1a1a] dark:text-white'
              }`}
              style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
            >
              {member.name.split(' ')[0]}&apos;s Properties
            </h2>
            <p className={`font-light text-center mb-12 max-w-2xl mx-auto ${isRC ? 'text-[var(--rc-brown)]' : 'text-[#6a6a6a] dark:text-gray-400'}`}>
              Browse {member.name.split(' ')[0]}&apos;s exclusive listings and recently sold properties
            </p>
            <AgentListingsGrid
              activeListings={agentListings.activeListings}
              soldListings={agentListings.soldListings}
            />
          </div>
        </section>
      )}

      {/* CTA / Contact Section */}
      {isRC ? (
        <section className="rc-inverted py-20 md:py-28 bg-[var(--rc-cream)]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              {/* Left — Agent photo + info */}
              <div>
                {/* Headshot */}
                {member.image && (
                  <div
                    className="relative w-[180px] md:w-[220px] overflow-hidden mb-6 bg-[var(--rc-navy)]/5"
                    style={{ aspectRatio: '450 / 560' }}
                  >
                    <Image
                      src={agentImageUrl!}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="220px"
                    />
                  </div>
                )}

                <h2
                  className="text-3xl md:text-4xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-4"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  Work With {member.name.split(' ')[0]}
                </h2>
                <p className="text-[var(--rc-brown)] font-light mb-8 leading-relaxed">
                  Get in touch to explore real estate opportunities with {member.name}.
                </p>

                <div className="space-y-3">
                  {member.mobile && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-[var(--rc-gold)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
                      </svg>
                      <a href={`tel:${member.mobile}`} className="text-[var(--rc-navy)] text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        {member.mobile}
                      </a>
                    </div>
                  )}
                  {(member.office || member.phone) && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-[var(--rc-gold)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <a href={`tel:${member.office || member.phone}`} className="text-[var(--rc-navy)] text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        {member.office || member.phone}
                      </a>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-[var(--rc-gold)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <a href={`mailto:${member.email}`} className="text-[var(--rc-navy)] text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Contact form */}
              <div>
                <AgentContactForm agentName={member.name} agentEmail={member.email} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 md:py-28 bg-[var(--color-navy)]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-wide mb-6 font-serif"
            >
              Work With {member.name.split(' ')[0]}
            </h2>
            <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
              Get in touch to explore real estate opportunities.
            </p>
            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)]"
              >
                Get in Touch
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            ) : (
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-3 px-10 py-4 bg-transparent border border-[var(--color-gold)] text-white transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light hover:bg-[var(--color-gold)] hover:text-[var(--color-navy)]"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
