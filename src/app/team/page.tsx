import { client } from "@/sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { Metadata } from "next";
import { getSiteTemplate } from "@/lib/settings";
import TeamGrid from "@/components/TeamGrid";

const builder = createImageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

interface TeamMember {
  _id: string;
  name: string;
  slug: { current: string };
  title?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
}

const ALL_TEAM_QUERY = `*[_type == "teamMember" && defined(slug.current) && inactive != true && defined(title) && title != ""] | order(order asc, name asc) {
  _id,
  name,
  slug,
  title,
  image,
  email,
  phone,
  mobile,
  office
}`;

const options = { next: { revalidate: 60 } };

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet our team of experienced real estate professionals.",
};

export default async function TeamPage() {
  const [members, template] = await Promise.all([
    client.fetch<TeamMember[]>(ALL_TEAM_QUERY, {}, options),
    getSiteTemplate(),
  ]);

  const isRC = template === "rcsothebys-custom";

  // Process image URLs server-side for the client component
  const processedMembers = members.map((m) => ({
    _id: m._id,
    name: m.name,
    slug: m.slug,
    title: m.title,
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

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className={
          isRC
            ? "bg-[var(--rc-navy)] py-16 md:py-24"
            : "bg-[var(--color-navy,#002349)] py-16 md:py-24"
        }
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1
            className={
              isRC
                ? "text-3xl md:text-4xl lg:text-5xl font-light uppercase tracking-[0.08em] text-white mb-4"
                : "font-serif text-white mb-4"
            }
            style={isRC ? { fontFamily: "var(--font-figtree), Figtree, sans-serif", lineHeight: "1.1em" } : undefined}
          >
            {isRC ? "Retter & Company Sotheby's International Realty Team" : "Our Team"}
          </h1>
          <p
            className={
              isRC
                ? "text-white/60 text-base md:text-lg font-normal max-w-2xl mx-auto"
                : "text-white/70 text-lg font-light max-w-2xl mx-auto"
            }
          >
            {isRC ? "Meet our Experienced Tri-Cities Real Estate Agents" : "Meet our experienced real estate professionals"}
          </p>
          {!isRC && (
            <p className="text-white/50 text-sm mt-3 font-light">
              {members.length} Agents
            </p>
          )}
        </div>
      </section>

      {/* Team Grid with Letter Filter */}
      <section
        className={
          isRC
            ? "py-16 md:py-24 bg-[var(--rc-cream)]"
            : "py-16 md:py-24 bg-white dark:bg-[#1a1a1a]"
        }
      >
        <div className="max-w-7xl mx-auto px-6">
          <TeamGrid members={processedMembers} isRC={isRC} totalCount={members.length} />
        </div>
      </section>
    </main>
  );
}
