import { client } from '@/sanity/client';

export interface MLSConfiguration {
  excludedPropertyTypes: { propertyType: string; excluded: boolean }[];
  excludedPropertySubTypes: { propertySubType: string; excluded: boolean }[];
  allowedCities: { city: string; allowed: boolean }[];
  excludedStatuses: { status: string; excluded: boolean }[];
}

const MLS_CONFIG_QUERY = `*[_type == "mlsConfiguration"][0]{
  excludedPropertyTypes,
  excludedPropertySubTypes,
  allowedCities,
  excludedStatuses
}`;

export async function getMLSConfiguration(): Promise<MLSConfiguration | null> {
  try {
    const config = await client.fetch<MLSConfiguration>(
      MLS_CONFIG_QUERY,
      {},
      { next: { revalidate: 60 } } // Cache for 1 minute
    );
    return config || null;
  } catch (error) {
    console.error('Error fetching MLS configuration:', error);
    return null;
  }
}

export function getExcludedPropertyTypes(config: MLSConfiguration | null): string[] {
  if (!config?.excludedPropertyTypes) return [];
  return config.excludedPropertyTypes
    .filter((item) => item.excluded)
    .map((item) => item.propertyType);
}

export function getExcludedPropertySubTypes(config: MLSConfiguration | null): string[] {
  if (!config?.excludedPropertySubTypes) return [];
  return config.excludedPropertySubTypes
    .filter((item) => item.excluded)
    .map((item) => item.propertySubType);
}

export function getAllowedCities(config: MLSConfiguration | null): string[] {
  if (!config?.allowedCities) return [];
  return config.allowedCities
    .filter((item: { city: string; allowed: boolean }) => item.allowed)
    .map((item: { city: string; allowed: boolean }) => item.city);
}

export function getExcludedStatuses(config: MLSConfiguration | null): string[] {
  if (!config?.excludedStatuses) return [];
  return config.excludedStatuses
    .filter((item) => item.excluded)
    .map((item) => item.status);
}
