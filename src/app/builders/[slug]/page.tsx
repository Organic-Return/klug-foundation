import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import AgentContactForm from "@/components/AgentContactForm";

const BUILDER_QUERY = `*[_type == "builder" && slug.current == $slug][0]{
  _id,
  name,
  slug,
  logo,
  description,
  descriptionHtml,
  website,
  phone,
  email,
  agentMlsIds
}`;

// Query team members by their MLS agent IDs
const AGENTS_BY_MLS_IDS = `*[_type == "teamMember" && inactive != true && (
  mlsAgentId in $ids || mlsAgentIdSold in $ids
)] {
  _id,
  name,
  slug,
  title,
  image,
  phone,
  mobile,
  email,
  mlsAgentId
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 60 } };

type Props = {
  params: Promise<{ slug: string }>;
};

interface Builder {
  _id: string;
  name: string;
  slug: { current: string };
  logo?: any;
  description?: string;
  descriptionHtml?: string;
  website?: string;
  phone?: string;
  email?: string;
  agentMlsIds?: string[];
}

interface Agent {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  image?: any;
  phone?: string;
  mobile?: string;
  email?: string;
  mlsAgentId?: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const builder = await client.fetch<Builder | null>(BUILDER_QUERY, { slug }, options);

  if (!builder) {
    return { title: 'Builder Not Found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  // Strip HTML for description
  const plainDesc = builder.descriptionHtml
    ? builder.descriptionHtml.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim().slice(0, 160)
    : builder.description?.slice(0, 160) || '';

  return {
    title: `${builder.name} | Builders`,
    description: plainDesc,
    alternates: { canonical: `${baseUrl}/builders/${slug}` },
    openGraph: {
      title: `${builder.name} | Builders`,
      description: plainDesc,
      type: 'website',
      url: `${baseUrl}/builders/${slug}`,
    },
  };
}

export default async function BuilderDetailPage({ params }: Props) {
  const { slug } = await params;
  const [builder, template] = await Promise.all([
    client.fetch<Builder | null>(BUILDER_QUERY, { slug }, options),
    getSiteTemplate(),
  ]);

  if (!builder) {
    notFound();
  }

  const isRC = template === 'rcsothebys-custom';

  // Fetch representing agents if MLS IDs are available
  let agents: Agent[] = [];
  if (builder.agentMlsIds && builder.agentMlsIds.length > 0) {
    agents = await client.fetch<Agent[]>(AGENTS_BY_MLS_IDS, { ids: builder.agentMlsIds }, options);
  }

  const logoUrl = builder.logo ? urlFor(builder.logo)?.width(600).height(400).url() : null;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      {isRC ? (
        <section className="rc-inverted bg-[var(--rc-navy)] py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">Home</Link>
              <span className="text-white/30 mx-2">/</span>
              <Link href="/builders" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">Builders</Link>
              <span className="text-white/30 mx-2">/</span>
              <span className="text-white/80 text-sm font-light">{builder.name}</span>
            </div>

            <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-start">
              {/* Logo */}
              {logoUrl && (
                <div className="flex-shrink-0 mx-auto md:mx-0 bg-white/10 p-6 w-[250px] md:w-[300px] flex items-center justify-center">
                  <Image src={logoUrl} alt={builder.name} width={280} height={180} className="object-contain" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  {builder.name}
                </h1>

                {/* Contact details */}
                <div className="space-y-2 mb-6">
                  {builder.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <a href={`tel:${builder.phone}`} className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        {builder.phone}
                      </a>
                    </div>
                  )}
                  {builder.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <a href={`mailto:${builder.email}`} className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        {builder.email}
                      </a>
                    </div>
                  )}
                  {builder.website && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      <a href={builder.website} target="_blank" rel="noopener noreferrer" className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--color-navy)] py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 text-center">
            <div className="mb-8">
              <Link href="/" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">Home</Link>
              <span className="text-white/30 mx-2">/</span>
              <Link href="/builders" className="text-white/50 hover:text-white/80 text-sm font-light transition-colors">Builders</Link>
              <span className="text-white/30 mx-2">/</span>
              <span className="text-white/80 text-sm font-light">{builder.name}</span>
            </div>
            <h1 className="font-serif text-white mb-4">{builder.name}</h1>
          </div>
        </section>
      )}

      {/* Description */}
      {(builder.descriptionHtml || builder.description) && (
        <section className={`py-16 md:py-24 ${isRC ? 'bg-[var(--rc-cream)]' : 'bg-white dark:bg-[#1a1a1a]'}`}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <h2
              className={`text-2xl md:text-3xl font-light mb-8 ${
                isRC
                  ? 'uppercase tracking-[0.08em] text-[var(--rc-navy)]'
                  : 'font-serif text-[#1a1a1a] dark:text-white tracking-wide'
              }`}
              style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
            >
              About {builder.name}
            </h2>
            {builder.descriptionHtml ? (
              <div
                className={`prose prose-lg max-w-none font-light leading-relaxed ${
                  isRC
                    ? '[&_p]:text-[var(--rc-brown)] [&_p]:mb-6 [&_strong]:text-[var(--rc-navy)] [&_a]:text-[var(--rc-gold)] [&_a]:underline [&_ul]:list-disc [&_ul]:ml-6 [&_li]:text-[var(--rc-brown)]'
                    : 'text-[#4a4a4a] dark:text-gray-300 [&_a]:text-[var(--color-gold)] [&_a]:underline'
                }`}
                dangerouslySetInnerHTML={{ __html: builder.descriptionHtml }}
              />
            ) : (
              <p className={`font-light leading-relaxed text-[17px] ${isRC ? 'text-[var(--rc-brown)]' : 'text-[#4a4a4a] dark:text-gray-300'}`}>
                {builder.description}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Representing Agents */}
      {agents.length > 0 && (
        <section className={`py-16 md:py-24 ${isRC ? 'rc-inverted bg-[var(--rc-navy)]' : 'bg-[#f8f7f5] dark:bg-[#141414]'}`}>
          <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
            <h2
              className={`text-2xl md:text-3xl font-light mb-10 text-center ${
                isRC
                  ? 'uppercase tracking-[0.08em] text-white'
                  : 'font-serif text-[#1a1a1a] dark:text-white tracking-wide'
              }`}
              style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
            >
              {isRC ? 'Representing Agents' : 'Our Agents for This Builder'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {agents.map((agent) => {
                const agentImageUrl = agent.image
                  ? urlFor(agent.image)?.width(300).height(375).url()
                  : null;
                const agentHref = isRC ? `/agents/${agent.slug.current}` : `/team/${agent.slug.current}`;

                return (
                  <Link
                    key={agent._id}
                    href={agentHref}
                    className="group block text-center"
                  >
                    <div
                      className={`relative mx-auto w-[180px] overflow-hidden mb-4 ${isRC ? 'bg-white/5' : 'bg-gray-100 dark:bg-gray-800'}`}
                      style={{ aspectRatio: '300 / 375' }}
                    >
                      {agentImageUrl ? (
                        <Image
                          src={agentImageUrl}
                          alt={agent.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="180px"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isRC ? 'text-white/20' : 'text-gray-300'}`}>
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className={`text-base font-light mb-1 ${
                      isRC
                        ? 'text-white uppercase tracking-[0.06em]'
                        : 'text-[#1a1a1a] dark:text-white font-serif'
                    }`}
                      style={isRC ? { fontFamily: 'var(--font-figtree), Figtree, sans-serif' } : undefined}
                    >
                      {agent.name}
                    </h3>
                    {agent.title && (
                      <p className={`text-xs font-light ${isRC ? 'text-[var(--rc-gold)]' : 'text-[var(--color-gold)]'}`}>
                        {agent.title}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {isRC && (
        <section className="py-20 md:py-28 bg-[var(--rc-cream)]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <h2
                  className="text-3xl md:text-4xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-4"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  Interested in {builder.name}?
                </h2>
                <p className="text-[var(--rc-brown)] font-light mb-8 leading-relaxed">
                  Contact us to learn more about building opportunities with {builder.name}.
                </p>
              </div>
              <div>
                <AgentContactForm
                  agentName="Retter & Company Sotheby's International Realty"
                  agentEmail="info@rcsothebysrealty.com"
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
