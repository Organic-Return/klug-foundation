import type { Metadata } from 'next';
import { getSiteName, getBaseUrl } from '@/lib/settings';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, siteName] = await Promise.all([getBaseUrl(), getSiteName()]);
  return {
    title: `Terms of Service | ${siteName}`,
    description: `Terms of service for ${siteName}.`,
    alternates: { canonical: `${baseUrl}/terms-of-service` },
  };
}

export default async function TermsOfServicePage() {
  const siteName = await getSiteName();
  return (
    <main className="min-h-screen">
      <section className="relative pt-36 pb-2 md:pt-44 md:pb-2 bg-[var(--color-sothebys-blue)]">
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <h1 className="font-serif text-white mb-6">Terms of Service</h1>
          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl leading-relaxed">
            Last updated: 2026
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16 prose dark:prose-invert prose-neutral">
          <p>
            Welcome to {siteName}. By accessing or using this website, you agree to be bound by these
            Terms of Service.
          </p>
          <h2>Use of the Site</h2>
          <p>
            The content on this site is provided for general information only and does not constitute
            advice on which you should rely. Property information is sourced from MLS feeds and
            third-party providers and is deemed reliable but not guaranteed.
          </p>
          <h2>Intellectual Property</h2>
          <p>
            All content, listings, photographs, and other materials are the property of {siteName} or
            their respective owners and may not be reproduced without permission.
          </p>
          <h2>Fair Housing</h2>
          <p>
            {siteName} fully supports the principles of the Fair Housing Act and the Equal Opportunity
            Act. Each office is independently owned and operated.
          </p>
          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {siteName} disclaims any liability for errors,
            omissions, or interruptions in service. Property details, dimensions, and prices are
            subject to change without notice.
          </p>
          <h2>Contact</h2>
          <p>
            For questions about these terms, please use the contact form on this site.
          </p>
        </div>
      </section>
    </main>
  );
}
