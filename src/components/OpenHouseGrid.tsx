'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getListingHref, type MLSProperty } from '@/lib/listings';

interface OpenHouseGridProps {
  listings: MLSProperty[];
  showOurTeamFilter?: boolean;
  teamAgentIds?: string[];
  teamOfficeNames?: string[];
}

function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatOpenHouseDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(t: string): string {
  // RESO OpenHouse times are stored in UTC (e.g. "2026-02-16 20:00:00+00").
  // Convert to the property's local timezone (Pacific for Tri-Cities WA).
  const date = new Date(t);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  }
  // Fallback for simple "HH:MM" strings
  const [hours, minutes] = t.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatOpenHouseTime(
  startTime: string | null,
  endTime: string | null
): string {
  if (!startTime) return '';
  const start = formatTime(startTime);
  if (!endTime) return start;
  const end = formatTime(endTime);
  return `${start} – ${end}`;
}

function groupByDate(
  listings: MLSProperty[]
): Map<string, MLSProperty[]> {
  const groups = new Map<string, MLSProperty[]>();
  for (const listing of listings) {
    const key = listing.open_house_date || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(listing);
  }
  return groups;
}

function isOurListing(
  listing: MLSProperty,
  teamAgentIds: string[],
  teamOfficeNames: string[]
): boolean {
  if (listing.list_agent_mls_id && teamAgentIds.includes(listing.list_agent_mls_id)) {
    return true;
  }
  if (listing.list_office_name) {
    const officeLower = listing.list_office_name.toLowerCase();
    return teamOfficeNames.some((name) => officeLower.includes(name.toLowerCase()));
  }
  return false;
}

function OpenHouseCard({ listing }: { listing: MLSProperty }) {
  const [imgError, setImgError] = useState(false);
  const photo = listing.photos?.[0] || null;

  return (
    <Link
      href={getListingHref(listing)}
      className="group block bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {photo && !imgError ? (
          <Image
            src={photo}
            alt={listing.address || 'Property'}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Open House Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold bg-[var(--rc-gold)] text-white">
            Open House
          </span>
        </div>
      </div>

      {/* Date/Time Banner */}
      <div className="bg-[var(--rc-navy)] px-5 py-3 text-center">
        <div className="text-white text-sm font-medium tracking-wider uppercase">
          {formatOpenHouseDate(listing.open_house_date)}
        </div>
        {(listing.open_house_start_time || listing.open_house_end_time) && (
          <div className="text-[var(--rc-gold)] text-xs tracking-wider mt-0.5">
            {formatOpenHouseTime(listing.open_house_start_time, listing.open_house_end_time)}
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="px-5 py-4 text-center">
        <div className="text-[var(--rc-navy)] text-xl font-light tracking-wide mb-1">
          {formatPrice(listing.list_price)}
        </div>
        <div className="text-[var(--rc-brown)] text-sm uppercase tracking-wider line-clamp-1 mb-1">
          {listing.address || 'Address not available'}
        </div>
        <div className="text-[var(--rc-brown)]/60 text-xs uppercase tracking-wider mb-3">
          {[listing.city, listing.state].filter(Boolean).join(', ')}
        </div>
        <div className="flex justify-center items-center gap-3 text-[var(--rc-brown)] text-xs uppercase tracking-wider">
          {listing.bedrooms != null && <span>{listing.bedrooms} BD</span>}
          {listing.bathrooms != null && (
            <>
              <span className="text-[var(--rc-brown)]/30">|</span>
              <span>{listing.bathrooms} BA</span>
            </>
          )}
          {listing.square_feet != null && (
            <>
              <span className="text-[var(--rc-brown)]/30">|</span>
              <span>{listing.square_feet.toLocaleString()} SF</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function OpenHouseGrid({
  listings,
  showOurTeamFilter = false,
  teamAgentIds = [],
  teamOfficeNames = [],
}: OpenHouseGridProps) {
  const [ourOpenHousesOnly, setOurOpenHousesOnly] = useState(false);

  const filtered = ourOpenHousesOnly
    ? listings.filter((l) => isOurListing(l, teamAgentIds, teamOfficeNames))
    : listings;

  const grouped = groupByDate(filtered);

  return (
    <div>
      {/* Filter Toggle */}
      {showOurTeamFilter && (
        <div className="flex justify-center mb-10">
          <button
            onClick={() => setOurOpenHousesOnly(!ourOpenHousesOnly)}
            className={`
              px-6 py-2.5 text-xs uppercase tracking-[0.15em] font-medium
              border transition-all duration-200
              ${ourOpenHousesOnly
                ? 'bg-[var(--rc-navy)] text-white border-[var(--rc-navy)]'
                : 'bg-transparent text-[var(--rc-navy)] border-[var(--rc-navy)] hover:bg-[var(--rc-navy)]/5'
              }
            `}
          >
            Our Open Houses
          </button>
        </div>
      )}

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-12">
          {Array.from(grouped.entries()).map(([dateKey, dateListings]) => (
            <div key={dateKey}>
              {/* Date Group Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-lg text-[var(--rc-navy)] whitespace-nowrap uppercase tracking-[0.08em] font-light"
                  style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
                >
                  {formatOpenHouseDate(dateKey)}
                </h2>
                <div className="flex-1 h-px bg-[var(--rc-brown)]/20" />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {dateListings.map((listing) => (
                  <OpenHouseCard key={`${listing.id}-${listing.open_house_date}`} listing={listing} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : ourOpenHousesOnly ? (
        <div className="text-center py-16">
          <h2
            className="text-xl md:text-2xl font-light uppercase tracking-[0.08em] text-[var(--rc-navy)] mb-3"
            style={{ fontFamily: 'var(--font-figtree), Figtree, sans-serif' }}
          >
            No Upcoming Open Houses
          </h2>
          <p className="text-[var(--rc-brown)] text-sm max-w-md mx-auto">
            We don&apos;t have any open houses scheduled at this time. Please check back soon
            or contact us for a private showing.
          </p>
        </div>
      ) : null}
    </div>
  );
}
