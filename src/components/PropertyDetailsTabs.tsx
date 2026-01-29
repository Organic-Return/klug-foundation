'use client';

import { useState } from 'react';

interface PropertyDetailsTabsProps {
  description?: string | null;
  overview: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    bathroomsFull?: number | null;
    bathroomsThreeQuarter?: number | null;
    bathroomsHalf?: number | null;
    squareFeet?: number | null;
    lotSize?: number | null;
    yearBuilt?: number | null;
    propertyType?: string | null;
    subdivisionName?: string | null;
    mlsAreaMinor?: string | null;
    mlsNumber: string;
    listingDate?: string | null;
    daysOnMarket?: number | null;
    furnished?: string | null;
  };
  features: {
    fireplaceYn?: boolean | null;
    fireplaceTotal?: number | null;
    fireplaceFeatures?: string[] | null;
    cooling?: string[] | null;
    heating?: string[] | null;
    laundryFeatures?: string[] | null;
    attachedGarageYn?: boolean | null;
    parkingFeatures?: string[] | null;
    associationAmenities?: string[] | null;
    otherFeatures?: Record<string, unknown> | null;
  };
}

type TabKey = 'description' | 'overview' | 'features';

export default function PropertyDetailsTabs({
  description,
  overview,
  features,
}: PropertyDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('description');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'overview', label: 'Overview' },
    { key: 'features', label: 'Features & Amenities' },
  ];

  const formatSqft = (sqft: number) => `${sqft.toLocaleString()} sq ft`;
  const formatLotSize = (acres: number) => {
    if (acres >= 1) return `${acres.toFixed(2)} acres`;
    return `${Math.round(acres * 43560).toLocaleString()} sq ft`;
  };

  return (
    <div className="bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex" aria-label="Property details tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-sm font-medium uppercase tracking-[0.15em] transition-all duration-300 border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[var(--color-sothebys-blue)] text-[var(--color-sothebys-blue)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-8 px-6">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="animate-fadeIn">
            {description ? (
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">
                {description}
              </p>
            ) : (
              <p className="text-gray-400 italic">No description available.</p>
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <OverviewItem label="MLS #" value={overview.mlsNumber} />
              {overview.propertyType && (
                <OverviewItem label="Property Type" value={overview.propertyType} />
              )}
              {overview.bedrooms !== null && overview.bedrooms !== undefined && (
                <OverviewItem label="Bedrooms" value={overview.bedrooms.toString()} />
              )}
              {overview.bathrooms !== null && overview.bathrooms !== undefined && (
                <OverviewItem
                  label="Bathrooms"
                  value={overview.bathrooms.toString()}
                  subValue={
                    overview.bathroomsFull || overview.bathroomsThreeQuarter || overview.bathroomsHalf
                      ? [
                          overview.bathroomsFull && `${overview.bathroomsFull} full`,
                          overview.bathroomsThreeQuarter && `${overview.bathroomsThreeQuarter} ¾`,
                          overview.bathroomsHalf && `${overview.bathroomsHalf} half`,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : undefined
                  }
                />
              )}
              {overview.squareFeet && (
                <OverviewItem label="Living Area" value={formatSqft(overview.squareFeet)} />
              )}
              {overview.lotSize && (
                <OverviewItem label="Lot Size" value={formatLotSize(overview.lotSize)} />
              )}
              {overview.yearBuilt && (
                <OverviewItem label="Year Built" value={overview.yearBuilt.toString()} />
              )}
              {overview.subdivisionName && (
                <OverviewItem label="Subdivision" value={overview.subdivisionName} />
              )}
              {overview.mlsAreaMinor && (
                <OverviewItem label="Area" value={overview.mlsAreaMinor} />
              )}
              {overview.listingDate && (
                <OverviewItem
                  label="Listed"
                  value={new Date(overview.listingDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              )}
              {overview.daysOnMarket !== null && overview.daysOnMarket !== undefined && (
                <OverviewItem label="Days on Market" value={overview.daysOnMarket.toString()} />
              )}
              {overview.furnished && (
                <OverviewItem label="Furnished" value={overview.furnished} />
              )}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="animate-fadeIn space-y-8">
            {/* Interior Features */}
            {(features.fireplaceYn || features.cooling?.length || features.heating?.length || features.laundryFeatures?.length) && (
              <FeatureSection title="Interior Features">
                {features.fireplaceYn && (
                  <FeatureItem
                    label="Fireplace"
                    value={
                      features.fireplaceTotal
                        ? `${features.fireplaceTotal} fireplace${features.fireplaceTotal > 1 ? 's' : ''}`
                        : 'Yes'
                    }
                  />
                )}
                {features.fireplaceFeatures && features.fireplaceFeatures.length > 0 && (
                  <FeatureItem label="Fireplace Features" value={features.fireplaceFeatures.join(', ')} />
                )}
                {features.cooling && features.cooling.length > 0 && (
                  <FeatureItem label="Cooling" value={features.cooling.join(', ')} />
                )}
                {features.heating && features.heating.length > 0 && (
                  <FeatureItem label="Heating" value={features.heating.join(', ')} />
                )}
                {features.laundryFeatures && features.laundryFeatures.length > 0 && (
                  <FeatureItem label="Laundry" value={features.laundryFeatures.join(', ')} />
                )}
              </FeatureSection>
            )}

            {/* Parking */}
            {(features.attachedGarageYn !== null || features.parkingFeatures?.length) && (
              <FeatureSection title="Parking & Garage">
                {features.attachedGarageYn !== null && features.attachedGarageYn !== undefined && (
                  <FeatureItem label="Attached Garage" value={features.attachedGarageYn ? 'Yes' : 'No'} />
                )}
                {features.parkingFeatures && features.parkingFeatures.length > 0 && (
                  <FeatureItem label="Parking Features" value={features.parkingFeatures.join(', ')} />
                )}
              </FeatureSection>
            )}

            {/* Association Amenities */}
            {features.associationAmenities && features.associationAmenities.length > 0 && (
              <FeatureSection title="Association Amenities">
                <div className="flex flex-wrap gap-2 pt-2">
                  {features.associationAmenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#f8f7f5] text-gray-700 text-sm rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </FeatureSection>
            )}

            {/* Other Features */}
            {features.otherFeatures && Object.keys(features.otherFeatures).length > 0 && (
              <FeatureSection title="Additional Features">
                {Object.entries(features.otherFeatures).map(([key, value]) => (
                  <FeatureItem
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  />
                ))}
              </FeatureSection>
            )}

            {/* No features message */}
            {!features.fireplaceYn &&
              !features.cooling?.length &&
              !features.heating?.length &&
              !features.laundryFeatures?.length &&
              features.attachedGarageYn === null &&
              !features.parkingFeatures?.length &&
              !features.associationAmenities?.length &&
              (!features.otherFeatures || Object.keys(features.otherFeatures).length === 0) && (
                <p className="text-gray-400 italic">No features information available.</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components
function OverviewItem({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex justify-between items-baseline py-3 border-b border-gray-100">
      <dt className="text-gray-500 text-sm uppercase tracking-wider">{label}</dt>
      <dd className="text-right">
        <span className="font-medium text-gray-900">{value}</span>
        {subValue && <span className="block text-xs text-gray-400 mt-0.5">{subValue}</span>}
      </dd>
    </div>
  );
}

function FeatureSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--color-sothebys-blue)] mb-4 pb-2 border-b border-gray-200">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2">
      <dt className="text-gray-500 text-sm">{label}</dt>
      <dd className="font-medium text-gray-900 text-right max-w-[60%]">{value}</dd>
    </div>
  );
}
