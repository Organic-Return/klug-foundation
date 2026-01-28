import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import {
  getDistinctCities,
  getDistinctPropertyTypes,
  getDistinctStatuses,
} from '@/lib/listings';

// Create a Sanity client with write access
const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1zb39xqr',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Requires a token with write access
});

export async function POST() {
  try {
    // Check for write token
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json(
        { error: 'SANITY_API_TOKEN environment variable is required for write access' },
        { status: 500 }
      );
    }

    // Fetch all distinct values from Supabase
    const [cities, propertyTypes, statuses] = await Promise.all([
      getDistinctCities(),
      getDistinctPropertyTypes(),
      getDistinctStatuses(),
    ]);

    // Check if MLS Configuration document exists
    const existingConfig = await sanityWriteClient.fetch(
      `*[_type == "mlsConfiguration"][0]`
    );

    // Prepare the document data
    const configData = {
      _type: 'mlsConfiguration',
      title: 'MLS Settings',
      excludedPropertyTypes: propertyTypes.map((type) => ({
        _key: type.replace(/\s+/g, '-').toLowerCase(),
        propertyType: type,
        excluded: existingConfig?.excludedPropertyTypes?.find(
          (item: { propertyType: string; excluded: boolean }) => item.propertyType === type
        )?.excluded || false,
      })),
      excludedCities: cities.map((city) => ({
        _key: city.replace(/\s+/g, '-').toLowerCase(),
        city: city,
        excluded: existingConfig?.excludedCities?.find(
          (item: { city: string; excluded: boolean }) => item.city === city
        )?.excluded || false,
      })),
      excludedStatuses: statuses.map((status) => ({
        _key: status.replace(/\s+/g, '-').toLowerCase(),
        status: status,
        excluded: existingConfig?.excludedStatuses?.find(
          (item: { status: string; excluded: boolean }) => item.status === status
        )?.excluded || false,
      })),
    };

    let result;
    if (existingConfig?._id) {
      // Update existing document
      result = await sanityWriteClient
        .patch(existingConfig._id)
        .set(configData)
        .commit();
    } else {
      // Create new document
      result = await sanityWriteClient.create(configData);
    }

    return NextResponse.json({
      success: true,
      message: 'MLS Configuration synced successfully',
      data: {
        propertyTypes: propertyTypes.length,
        cities: cities.length,
        statuses: statuses.length,
      },
      documentId: result._id,
    });
  } catch (error) {
    console.error('Error syncing MLS configuration:', error);
    return NextResponse.json(
      { error: 'Failed to sync MLS configuration', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch all distinct values from Supabase (for preview without write)
    const [cities, propertyTypes, statuses] = await Promise.all([
      getDistinctCities(),
      getDistinctPropertyTypes(),
      getDistinctStatuses(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        propertyTypes,
        cities,
        statuses,
        counts: {
          propertyTypes: propertyTypes.length,
          cities: cities.length,
          statuses: statuses.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching MLS data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MLS data', details: String(error) },
      { status: 500 }
    );
  }
}
