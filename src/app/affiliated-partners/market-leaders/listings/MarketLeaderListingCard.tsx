'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, toAddressSlug } from '@/lib/listings';

interface CardListing {
  id: string;
  street_address: string;
  city: string;
  state_province_code: string;
  price_amount: number;
  no_of_bedrooms: number | null;
  total_bath: number | null;
  square_footage: number | null;
  primary_agent_name: string;
}

interface Props {
  listing: CardListing;
  photoUrl: string;
  variant: 'active' | 'sold';
}

// Hides itself if next/image fails to load the cover photo. The server-side
// filter on the listings page can only prove the URL exists on the row;
// only the browser knows whether the URL actually resolves. When the image
// 404s upstream (Realogy CDN drops the asset, etc.) the entire tile
// vanishes from the grid instead of leaving a broken-image placeholder.
export default function MarketLeaderListingCard({ listing, photoUrl, variant }: Props) {
  const [imageBroken, setImageBroken] = useState(false);
  if (imageBroken) return null;

  const detailHref = `/affiliated-partners/market-leaders/listings/${toAddressSlug(listing.street_address)}`;
  const grayscaleClass = variant === 'sold' ? 'grayscale-[30%]' : '';

  return (
    <div className="group border border-gray-200 overflow-hidden">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-taupe)]">
          <Image
            src={photoUrl}
            alt={`${listing.street_address}, ${listing.city}, ${listing.state_province_code}`}
            fill
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${grayscaleClass}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImageBroken(true)}
          />
          {variant === 'sold' && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-[#8a8a8a] text-white">
                Sold
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-1 text-gray-900 font-semibold" style={{ fontSize: '1.125rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
          {formatPrice(listing.price_amount)}
        </h3>
        <p className="leading-snug line-clamp-1 text-sm text-gray-700" style={{ marginBottom: '0.125rem' }}>
          {listing.street_address?.trim()}
        </p>
        <p className="leading-snug line-clamp-1 text-xs text-gray-500" style={{ marginBottom: '0.5rem' }}>
          {listing.city}, {listing.state_province_code}
        </p>
        <div className="flex items-center gap-3 text-[10px] uppercase text-gray-500 tracking-wider">
          {listing.no_of_bedrooms != null && <span>{listing.no_of_bedrooms} Beds</span>}
          {listing.no_of_bedrooms != null && listing.total_bath != null && <span className="w-px h-3 bg-gray-300" />}
          {listing.total_bath != null && <span>{listing.total_bath} Baths</span>}
          {listing.total_bath != null && listing.square_footage != null && <span className="w-px h-3 bg-gray-300" />}
          {listing.square_footage != null && <span>{listing.square_footage.toLocaleString()} SF</span>}
        </div>
        {listing.primary_agent_name && (
          <p className="text-xs text-[#c9ac77] font-light mt-2">
            {listing.primary_agent_name}
          </p>
        )}
      </div>
    </div>
  );
}
