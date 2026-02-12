-- Create a view called "graphql_listings" that maps rc-listings RESO columns
-- to the column names expected by the Next.js application.
-- Run this in the Supabase SQL Editor for the rc-foundation project.
--
-- Updated: now uses RESO standard column names from the updated rc-listings table.
-- Uses COALESCE for status: prefers StandardStatus (RESO), falls back to MlsStatus.

DROP VIEW IF EXISTS public.graphql_listings CASCADE;
CREATE VIEW public.graphql_listings AS
SELECT
  id,
  created_at,
  "ModificationTimestamp" AS updated_at,
  "ListingId" AS listing_id,
  COALESCE("StandardStatus", "MlsStatus") AS status,
  "ListPrice" AS list_price,
  "ClosePrice" AS sold_price,
  "UnparsedAddress" AS address,
  "StreetNumber" AS street_number,
  "StreetName" AS street_name,
  NULL::text AS street_suffix,
  "UnitNumber" AS unit_number,
  "City" AS city,
  "StateOrProvince" AS state,
  "CountyOrParish" AS county,
  "PostalCode" AS zip_code,
  "BedroomsTotal" AS bedrooms,
  "BathroomsTotalInteger" AS bathrooms_total,
  "BathroomsFull" AS bathrooms_full,
  "BathroomsHalf" AS bathrooms_half,
  "BathroomsThreeQuarter" AS bathrooms_three_quarter,
  "LivingArea" AS square_feet,
  "LivingArea" AS living_area,
  "LotSizeSquareFeet" AS lot_size_square_feet,
  "LotSizeAcres" AS lot_size_acres,
  "YearBuilt" AS year_built,
  "PropertyType" AS property_type,
  "PropertySubType" AS property_sub_type,
  "ListingContractDate" AS listing_date,
  "CloseDate" AS close_date,
  "OriginalListPrice" AS original_list_price,
  "PublicRemarks" AS description,
  "SubdivisionName" AS subdivision_name,
  NULL::text AS mls_area_major,
  "Neighborhood" AS mls_area_minor,
  NULL::text AS preferred_photo,
  "Media" AS media,
  "Latitude" AS latitude,
  "Longitude" AS longitude,
  "ListOfficeName" AS list_office_name,
  "ListAgentMlsId" AS list_agent_mls_id,
  "ListAgentFirstName" AS list_agent_first_name,
  "ListAgentLastName" AS list_agent_last_name,
  "ListAgentEmail" AS list_agent_email,
  "ListAgentFullName" AS list_agent_full_name,
  "CoListAgentMlsId" AS co_list_agent_mls_id,
  "BuyerAgentMlsId" AS buyer_agent_mls_id,
  "CoBuyerAgentMlsId" AS co_buyer_agent_mls_id,
  "VirtualTourURLUnbranded" AS virtual_tour_url,
  NULL::text AS furnished,
  "FireplaceYN" AS fireplace_yn,
  "FireplaceFeatures" AS fireplace_features,
  "FireplacesTotal" AS fireplace_total,
  "Cooling" AS cooling,
  "Heating" AS heating,
  "LaundryFeatures" AS laundry_features,
  "AttachedGarageYN" AS attached_garage_yn,
  "ParkingFeatures" AS parking_features,
  NULL::text[] AS association_amenities
FROM public."rc-listings";

-- Grant read access to the anon role (required for Supabase client)
GRANT SELECT ON public.graphql_listings TO anon;
GRANT SELECT ON public.graphql_listings TO authenticated;
