import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const MARKET_REPORTS_QUERY = `*[_type == "publication" && publicationType == "market-report"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  headerImage,
  excerpt,
  publishedAt,
  featured
}`;

const { projectId, dataset } = client.config();
const urlFor = (source: any) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export const metadata: Metadata = {
  title: 'Market Reports | Real Estate Insights',
  description: 'Stay informed with our comprehensive market reports covering real estate trends, statistics, and analysis.',
  openGraph: {
    title: 'Market Reports | Real Estate Insights',
    description: 'Stay informed with our comprehensive market reports covering real estate trends, statistics, and analysis.',
    type: 'website',
  },
};

export default async function MarketReportsPage() {
  const reports = await client.fetch<SanityDocument[]>(MARKET_REPORTS_QUERY, {}, options);

  // Separate featured and regular reports
  const featuredReport = reports.find((r) => r.featured);
  const regularReports = reports.filter((r) => !r.featured || r._id !== featuredReport?._id);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[var(--color-sothebys-blue)] pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">
            Market Reports
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            In-depth analysis and insights into the luxury real estate market. Stay informed with our comprehensive reports.
          </p>
        </div>
      </section>

      {/* Featured Report */}
      {featuredReport && (
        <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-8">
              <span className="text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase">
                Featured Report
              </span>
            </div>
            <Link
              href={`/market-reports/${featuredReport.slug?.current}`}
              className="group block"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {featuredReport.headerImage && (
                    <Image
                      src={urlFor(featuredReport.headerImage)?.width(800).height(600).url() || ''}
                      alt={featuredReport.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1a1a1a] dark:text-white mb-4 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {featuredReport.title}
                  </h2>
                  {featuredReport.excerpt && (
                    <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-lg leading-relaxed mb-6">
                      {featuredReport.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#6a6a6a] dark:text-gray-400 font-light">
                      {new Date(featuredReport.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="mt-8">
                    <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-sm font-medium tracking-wider uppercase group-hover:gap-4 transition-all duration-300">
                      Read Report
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Divider */}
      {featuredReport && regularReports.length > 0 && (
        <div className="w-full flex justify-center py-4 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />
        </div>
      )}

      {/* All Reports Grid */}
      {regularReports.length > 0 && (
        <section className="py-16 md:py-24 bg-[#f8f7f5] dark:bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide">
                All Reports
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularReports.map((report) => (
                <Link
                  key={report._id}
                  href={`/market-reports/${report.slug?.current}`}
                  className="group bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 hover:border-[var(--color-gold)] transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {report.headerImage && (
                      <Image
                        src={urlFor(report.headerImage)?.width(600).height(375).url() || ''}
                        alt={report.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <span className="text-xs text-[#6a6a6a] dark:text-gray-400 font-light tracking-wider uppercase">
                      {new Date(report.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                    <h3 className="text-xl font-serif font-light text-[#1a1a1a] dark:text-white mt-2 mb-3 tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                      {report.title}
                    </h3>
                    {report.excerpt && (
                      <p className="text-[#4a4a4a] dark:text-gray-300 font-light text-sm leading-relaxed line-clamp-2">
                        {report.excerpt}
                      </p>
                    )}
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-2 text-[var(--color-gold)] text-xs font-medium tracking-wider uppercase">
                        Read More
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {reports.length === 0 && (
        <section className="py-24 md:py-32 bg-white dark:bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-4">
              No Reports Available
            </h2>
            <p className="text-[#6a6a6a] dark:text-gray-400 font-light">
              Market reports will be published soon. Check back later.
            </p>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-20 md:py-28 bg-[var(--color-sothebys-blue)] dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-white tracking-wide mb-6">
            Request a Custom Analysis
          </h2>
          <p className="text-lg text-white/70 font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            Need market insights for a specific area or property type? Our team can provide tailored analysis for your needs.
          </p>

          <Link
            href="/contact-us"
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-light transition-all duration-300 bg-[var(--color-gold)] text-white px-10 py-4 border border-[var(--color-gold)] hover:bg-transparent hover:border-white"
          >
            Contact Us
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
