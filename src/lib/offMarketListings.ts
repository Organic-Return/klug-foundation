import { client } from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

export interface OffMarketListing {
  _id: string;
  title: string;
  slug: string;
  status: string;
  listPrice: number | null;
  soldPrice: number | null;
  propertyType: string | null;
  listingDate: string | null;
  soldDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  subdivisionName: string | null;
  mlsAreaMinor: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathroomsFull: number | null;
  bathroomsThreeQuarter: number | null;
  bathroomsHalf: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  description: string | null;
  furnished: string | null;
  fireplaceYn: boolean;
  fireplaceTotal: number | null;
  fireplaceFeatures: string[] | null;
  cooling: string[] | null;
  heating: string[] | null;
  laundryFeatures: string[] | null;
  attachedGarageYn: boolean;
  parkingFeatures: string[] | null;
  associationAmenities: string[] | null;
  featuredImageUrl: string | null;
  photos: string[];
  virtualTourUrl: string | null;
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  officeName: string | null;
  requiresRegistration: boolean;
  featured: boolean;
  publishedAt: string | null;
}

const offMarketListingFields = `
  _id,
  title,
  "slug": slug.current,
  status,
  listPrice,
  soldPrice,
  propertyType,
  listingDate,
  soldDate,
  address,
  city,
  state,
  zipCode,
  subdivisionName,
  mlsAreaMinor,
  "latitude": coordinates.lat,
  "longitude": coordinates.lng,
  bedrooms,
  bathroomsFull,
  bathroomsThreeQuarter,
  bathroomsHalf,
  squareFeet,
  lotSize,
  yearBuilt,
  description,
  furnished,
  fireplaceYn,
  fireplaceTotal,
  fireplaceFeatures,
  cooling,
  heating,
  laundryFeatures,
  attachedGarageYn,
  parkingFeatures,
  associationAmenities,
  "featuredImageUrl": featuredImage.asset->url,
  "photos": photos[].asset->url,
  virtualTourUrl,
  agentName,
  agentEmail,
  agentPhone,
  officeName,
  requiresRegistration,
  featured,
  publishedAt
`;

function transformListing(data: any): OffMarketListing {
  return {
    _id: data._id,
    title: data.title,
    slug: data.slug,
    status: data.status || 'Active',
    listPrice: data.listPrice,
    soldPrice: data.soldPrice,
    propertyType: data.propertyType,
    listingDate: data.listingDate,
    soldDate: data.soldDate,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    subdivisionName: data.subdivisionName,
    mlsAreaMinor: data.mlsAreaMinor,
    latitude: data.latitude,
    longitude: data.longitude,
    bedrooms: data.bedrooms,
    bathroomsFull: data.bathroomsFull,
    bathroomsThreeQuarter: data.bathroomsThreeQuarter,
    bathroomsHalf: data.bathroomsHalf,
    squareFeet: data.squareFeet,
    lotSize: data.lotSize,
    yearBuilt: data.yearBuilt,
    description: data.description,
    furnished: data.furnished,
    fireplaceYn: data.fireplaceYn || false,
    fireplaceTotal: data.fireplaceTotal,
    fireplaceFeatures: data.fireplaceFeatures,
    cooling: data.cooling,
    heating: data.heating,
    laundryFeatures: data.laundryFeatures,
    attachedGarageYn: data.attachedGarageYn || false,
    parkingFeatures: data.parkingFeatures,
    associationAmenities: data.associationAmenities,
    featuredImageUrl: data.featuredImageUrl,
    photos: data.photos || [],
    virtualTourUrl: data.virtualTourUrl,
    agentName: data.agentName,
    agentEmail: data.agentEmail,
    agentPhone: data.agentPhone,
    officeName: data.officeName,
    requiresRegistration: data.requiresRegistration !== false,
    featured: data.featured || false,
    publishedAt: data.publishedAt,
  };
}

export async function getOffMarketListings(): Promise<OffMarketListing[]> {
  const query = `*[_type == "offMarketListing"] | order(listingDate desc) {
    ${offMarketListingFields}
  }`;

  const data = await client.fetch(query);
  return (data || []).map(transformListing);
}

export async function getFeaturedOffMarketListings(): Promise<OffMarketListing[]> {
  const query = `*[_type == "offMarketListing" && featured == true] | order(listingDate desc) {
    ${offMarketListingFields}
  }`;

  const data = await client.fetch(query);
  return (data || []).map(transformListing);
}

export async function getOffMarketListingBySlug(slug: string): Promise<OffMarketListing | null> {
  const query = `*[_type == "offMarketListing" && slug.current == $slug][0] {
    ${offMarketListingFields}
  }`;

  const data = await client.fetch(query, { slug });
  return data ? transformListing(data) : null;
}

export function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function getTotalBathrooms(listing: OffMarketListing): number {
  const full = listing.bathroomsFull || 0;
  const threeQuarter = listing.bathroomsThreeQuarter || 0;
  const half = listing.bathroomsHalf || 0;
  return full + threeQuarter * 0.75 + half * 0.5;
}
