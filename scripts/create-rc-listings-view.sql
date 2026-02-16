-- Create a view called "graphql_listings" that maps rc-listings RESO columns
-- to the column names expected by the Next.js application.
-- Run this in the Supabase SQL Editor for the rc-foundation project.
--
-- Uses COALESCE to prefer RESO fields, falling back to legacy fields.
-- All COALESCE fallbacks use explicit type casts to prevent type mismatch errors.

DROP VIEW IF EXISTS public.graphql_listings CASCADE;
CREATE VIEW public.graphql_listings AS
SELECT
  id,
  created_at,
  "ModificationTimestamp" AS updated_at,
  "ListingId" AS listing_id,
  COALESCE("StandardStatus", "MlsStatus", "Status") AS status,
  COALESCE("ListPrice", "SearchPrice"::bigint) AS list_price,
  "ClosePrice" AS sold_price,
  "UnparsedAddress" AS address,
  COALESCE("StreetNumber", "AddressNumber") AS street_number,
  COALESCE("StreetName", "AddressStreet") AS street_name,
  NULL::text AS street_suffix,
  "UnitNumber" AS unit_number,
  "City" AS city,
  COALESCE("StateOrProvince", "State") AS state,
  COALESCE("CountyOrParish", "County") AS county,
  COALESCE("PostalCode", "Zip") AS zip_code,
  COALESCE("BedroomsTotal", "Bedrooms") AS bedrooms,
  "BathroomsTotalInteger" AS bathrooms_total,
  COALESCE("BathroomsFull", "NumberofFullBaths"::text) AS bathrooms_full,
  COALESCE("BathroomsHalf", "Numberof1_2Baths"::text) AS bathrooms_half,
  COALESCE("BathroomsThreeQuarter", "Numberof3_4Baths"::text) AS bathrooms_three_quarter,
  COALESCE("LivingArea", "FinishedSQFT"::text) AS square_feet,
  COALESCE("LivingArea", "FinishedSQFT"::text) AS living_area,
  "LotSizeSquareFeet" AS lot_size_square_feet,
  COALESCE("LotSizeAcres", "NumberofAcres") AS lot_size_acres,
  "YearBuilt" AS year_built,
  "PropertyType" AS property_type,
  "PropertySubType" AS property_sub_type,
  COALESCE("ListingContractDate", "ListingDate"::date) AS listing_date,
  COALESCE("CloseDate", "ClosingDate"::date) AS close_date,
  "OriginalListPrice" AS original_list_price,
  "PublicRemarks" AS description,
  COALESCE("SubdivisionName", "Subdivision") AS subdivision_name,
  NULL::text AS mls_area_major,
  "Neighborhood" AS mls_area_minor,
  NULL::text AS preferred_photo,
  "Media" AS media,
  COALESCE("Latitude", "GeoLatitude"::text) AS latitude,
  COALESCE("Longitude", "GeoLongitude"::text) AS longitude,
  -- Office: prefer RESO, fall back to legacy
  COALESCE("ListOfficeName", "LO1OfficeName") AS list_office_name,
  -- Agent: prefer RESO ListAgentMlsId, fall back to legacy Agent (integer) field
  COALESCE("ListAgentMlsId", "Agent"::text) AS list_agent_mls_id,
  COALESCE("ListAgentFirstName", "LA1AgentFirstName") AS list_agent_first_name,
  COALESCE("ListAgentLastName", "LA1AgentLastName") AS list_agent_last_name,
  COALESCE("ListAgentEmail", "AgentEmail") AS list_agent_email,
  COALESCE("ListAgentFullName", CONCAT("LA1AgentFirstName", ' ', "LA1AgentLastName")) AS list_agent_full_name,
  "CoListAgentMlsId" AS co_list_agent_mls_id,
  "BuyerAgentMlsId" AS buyer_agent_mls_id,
  "CoBuyerAgentMlsId" AS co_buyer_agent_mls_id,
  COALESCE("VirtualTourURLUnbranded", "VirtualTour") AS virtual_tour_url,
  NULL::text AS furnished,
  "FireplaceYN" AS fireplace_yn,
  "FireplaceFeatures" AS fireplace_features,
  "FireplacesTotal" AS fireplace_total,
  "Cooling" AS cooling,
  "Heating" AS heating,
  "LaundryFeatures" AS laundry_features,
  "AttachedGarageYN" AS attached_garage_yn,
  "ParkingFeatures" AS parking_features,
  NULL::text[] AS association_amenities,
  -- Open House fields (RESO standard)
  "OpenHouseDate"::text AS open_house_date,
  "OpenHouseStartTime"::text AS open_house_start_time,
  "OpenHouseEndTime"::text AS open_house_end_time,
  "OpenHouseRemarks" AS open_house_remarks
FROM public."rc-listings";

-- Grant read access to the anon role (required for Supabase client)
GRANT SELECT ON public.graphql_listings TO anon;
GRANT SELECT ON public.graphql_listings TO authenticated;
