'use client';

import AgentContactForm from '@/components/AgentContactForm';

interface RCSitePageProps {
  title: string;
  heroImageUrl?: string | null;
  contentHtml?: string | null;
  embedUrl?: string | null;
  showContactForm?: boolean;
}

export default function RCSitePage({
  title,
  heroImageUrl,
  contentHtml,
  embedUrl,
  showContactForm = true,
}: RCSitePageProps) {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative h-[50vh] md:h-[60vh] min-h-[400px] flex items-end bg-cover bg-center"
        style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
      >
        {heroImageUrl ? (
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--rc-navy)]/90 via-[var(--rc-navy)]/40 to-[var(--rc-navy)]/20" />
        ) : (
          <div className="absolute inset-0 bg-[var(--rc-navy)]" />
        )}
        <div className="relative max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-16 pb-12 md:pb-20">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white max-w-4xl"
            style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
          >
            {title}
          </h1>
        </div>
      </section>

      {/* Content Section */}
      {contentHtml && (
        <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16">
            <div
              className="prose prose-lg max-w-none font-light leading-relaxed [&_p]:text-[var(--rc-brown)] [&_p]:mb-6 [&_p]:leading-[1.8] [&_p]:text-[17px] [&_h1]:text-[var(--rc-navy)] [&_h1]:text-2xl [&_h1]:md:text-3xl [&_h1]:font-light [&_h1]:uppercase [&_h1]:tracking-[0.06em] [&_h1]:mb-6 [&_h1]:mt-10 [&_h2]:text-[var(--rc-navy)] [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-light [&_h2]:uppercase [&_h2]:tracking-[0.06em] [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-[var(--rc-navy)] [&_h3]:text-lg [&_h3]:md:text-xl [&_h3]:font-light [&_h3]:uppercase [&_h3]:tracking-[0.04em] [&_h3]:mb-4 [&_h3]:mt-6 [&_strong]:text-[var(--rc-navy)] [&_a]:text-[var(--rc-gold)] [&_a]:underline [&_a:hover]:text-[var(--rc-navy)] [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6 [&_li]:text-[var(--rc-brown)] [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-6 [&_hr]:border-[var(--rc-gold)]/30 [&_hr]:my-8"
              style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </section>
      )}

      {/* Embed Section */}
      {embedUrl && (
        <section className="py-16 md:py-24 bg-[var(--rc-cream)]">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
            <iframe
              src={embedUrl}
              className="w-full border-0"
              style={{ height: '80vh', minHeight: '600px' }}
              title={title}
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      {showContactForm && (
        <section className="rc-inverted py-20 md:py-28 bg-[var(--rc-navy)]">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <h2
                  className="text-3xl md:text-4xl font-light uppercase tracking-[0.08em] text-white mb-4"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif', lineHeight: '1.1em' }}
                >
                  Contact Us
                </h2>
                <p className="text-white/70 font-light mb-8 leading-relaxed">
                  We&apos;d love to hear from you. Contact us today.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="text-white/80 text-sm font-light">329 N. Kellogg Street, Kennewick, WA 99336</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <a href="tel:509.783.8811" className="text-white/80 text-sm font-light hover:text-[var(--rc-gold)] transition-colors">
                      509.783.8811
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <AgentContactForm
                  agentName="Retter & Company Sotheby's International Realty"
                  agentEmail="info@rcsothebysrealty.com"
                  inverted
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
