import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "@/sanity/client";
import Image from "next/image";
import Link from "next/link";
import { formatPhone, phoneHref } from '@/lib/phoneUtils';
import { isRealogyConfigured, getRealogySupabase } from '@/lib/realogySupabase';
import { normalizePhotoUrl, parseRemarks } from '@/lib/realogyHelpers';

const { projectId, dataset } = client.config();
export const urlFor = (source: any) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

// Page content interface for CMS-driven page settings
export interface PageContent {
  _id: string;
  pageType: 'main' | 'ski_town' | 'market_leaders';
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: any;
  logo?: any;
  skiTownCard?: {
    title?: string;
    description?: string;
    image?: any;
    icon?: string;
  };
  marketLeadersCard?: {
    title?: string;
    description?: string;
    image?: any;
    icon?: string;
  };
  featuredSectionTitle?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonAction?: 'link' | 'contact_modal';
  ctaButtonLink?: string;
}

export interface AgentData {
  agentStaffId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string;
}

export interface Partner {
  _id: string;
  partnerType: 'ski_town' | 'market_leader';
  firstName: string;
  lastName: string;
  agentStaffId: string;
  slug?: { current: string };
  title?: string;
  company?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string;
  website?: string;
  overridePhoto?: any;
  overrideBio?: string;
  specialties?: string[];
  featured?: boolean;
}

export interface EnrichedPartner extends Partner {
  photoUrl: string | null;
  bio: string;
}

export async function fetchAgentData(agentStaffId: string, firstName?: string, lastName?: string): Promise<AgentData | null> {
  // Query Realogy DB directly (avoids 401 during static build)
  if (!isRealogyConfigured()) return null;

  try {
    const supabase = getRealogySupabase();
    if (!supabase) return null;

    const isUuid = /^[0-9a-f]{8}-/.test(agentStaffId);

    // Best approach: search by name first (most reliable), fall back to ID
    if (firstName && lastName) {
      const firstNameBase = firstName.split(' ')[0]; // "K. Ann" -> "K."
      const { data: byName } = await supabase
        .from('realogy_agents')
        .select('first_name, last_name, photo_url, rfg_staff_id, entity_id, id, remarks, office_name')
        .ilike('first_name', `${firstNameBase}%`)
        .ilike('last_name', `${lastName}%`)
        .limit(1)
        .maybeSingle();

      if (byName) {
        return {
          agentStaffId: byName.rfg_staff_id || byName.entity_id || byName.id,
          firstName: byName.first_name || '',
          lastName: byName.last_name || '',
          photoUrl: normalizePhotoUrl(byName.photo_url),
          bio: parseRemarks(byName.remarks),
        };
      }
    }

    // Fallback: search by ID (for backwards compat)
    const column = isUuid ? 'id' : 'rfg_staff_id';
    let { data } = await supabase
      .from('realogy_agents')
      .select('first_name, last_name, photo_url, rfg_staff_id, entity_id, id, remarks, office_name')
      .eq(column, agentStaffId)
      .limit(1)
      .maybeSingle();

    if (!data && !isUuid) {
      const fallback = await supabase
        .from('realogy_agents')
        .select('first_name, last_name, photo_url, rfg_staff_id, entity_id, id, remarks, office_name')
        .eq('entity_id', agentStaffId)
        .limit(1)
        .maybeSingle();
      data = fallback.data;
    }

    if (!data) return null;

    return {
      agentStaffId: data.rfg_staff_id || data.entity_id || data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      photoUrl: normalizePhotoUrl(data.photo_url),
      bio: parseRemarks(data.remarks),
    };
  } catch (error) {
    console.error(`Error fetching agent ${agentStaffId}:`, error);
    return null;
  }
}

export async function enrichPartnerWithAgentData(partner: Partner): Promise<EnrichedPartner> {
  const agentData = await fetchAgentData(partner.agentStaffId, partner.firstName, partner.lastName);

  // Use override values from Sanity if provided, otherwise use database values
  const photoUrl = partner.overridePhoto
    ? urlFor(partner.overridePhoto)?.width(400).height(600).url() || null
    : agentData?.photoUrl || null;

  const bio = partner.overrideBio || agentData?.bio || '';

  return {
    ...partner,
    photoUrl,
    bio,
  };
}

// Helper to get partner detail URL
export function getPartnerUrl(partner: Partner | EnrichedPartner): string {
  const typeSlug = partner.partnerType === 'ski_town' ? 'ski-town' : 'market-leaders';
  const nameSlug = partner.slug?.current || `${partner.firstName}-${partner.lastName}`.toLowerCase().replace(/\s+/g, '-');
  return `/affiliated-partners/${typeSlug}/${nameSlug}`;
}

// Partner Card Component
export function PartnerCard({ partner, featured = false }: { partner: EnrichedPartner; featured?: boolean }) {
  const cardClasses = featured
    ? "bg-white dark:bg-[#1a1a1a] border border-[var(--color-gold)]/30 p-8 md:p-10"
    : "bg-white dark:bg-[#1a1a1a] border border-[#e8e6e3] dark:border-gray-800 p-6 md:p-8 hover:border-[var(--color-gold)]/30 transition-colors duration-300";

  const partnerUrl = getPartnerUrl(partner);

  return (
    <div className={cardClasses}>
      <div className="flex flex-col items-center text-center">
        {/* Photo */}
        <Link href={partnerUrl} className="relative w-full aspect-[4/6] overflow-hidden mb-6 bg-[#f0f0f0] dark:bg-gray-800 block hover:opacity-90 transition-opacity">
          {partner.photoUrl ? (
            <Image
              src={partner.photoUrl}
              alt={`${partner.firstName} ${partner.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#aaa] dark:text-gray-600">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Name & Title */}
        <Link href={partnerUrl} className="hover:text-[var(--color-gold)] transition-colors">
          <h3 className={`font-serif font-light text-[#1a1a1a] dark:text-white tracking-wide mb-1 ${featured ? 'text-2xl' : 'text-xl'}`}>
            <span className="block">{partner.firstName}</span>
            <span className="block">{partner.lastName}</span>
          </h3>
        </Link>
        {partner.title && (
          <p className="text-[var(--color-gold)] text-sm font-light mb-2">
            {partner.title}
          </p>
        )}
        {partner.company && (
          <p className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light mb-1">
            {partner.company}
          </p>
        )}
        {partner.location && (
          <p className="text-[#888] dark:text-gray-500 text-sm font-light mb-4">
            {partner.location}
          </p>
        )}

        {/* Bio */}
        {partner.bio && (
          <p className={`text-[#4a4a4a] dark:text-gray-300 font-light leading-relaxed mb-6 ${featured ? 'text-base' : 'text-sm line-clamp-4'}`}>
            {partner.bio}
          </p>
        )}

        {/* Specialties */}
        {partner.specialties && partner.specialties.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {partner.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#f8f7f5] dark:bg-[#252525] text-[#6a6a6a] dark:text-gray-400 text-xs font-light"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Contact Links */}
        <div className="flex items-center gap-4">
          {partner.email && (
            <a
              href={`mailto:${partner.email}`}
              className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
              title="Email"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          )}
          {partner.phone && (
            <a
              href={`tel:${phoneHref(partner.phone)}`}
              className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
              title="Phone"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          )}
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6a6a6a] dark:text-gray-400 hover:text-[var(--color-gold)] transition-colors"
              title="Website"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
