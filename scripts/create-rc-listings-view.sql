-- Create a view called "graphql_listings" that maps rc-listings RESO columns
-- to the column names expected by the Next.js application.
-- Run this in the Supabase SQL Editor for the rc-foundation project.
--
-- Uses COALESCE to prefer RESO fields, falling back to legacy fields.
-- All COALESCE fallbacks use explicit type casts to prevent type mismatch errors.
-- Media is pulled directly from rc-listings "Media" column.

DROP VIEW IF EXISTS public.graphql_listings CASCADE;
CREATE VIEW public.graphql_listings AS
SELECT
  r.id,
  r.created_at,
  r."ModificationTimestamp" AS updated_at,
  -- ListingId: prefer RESO field, fall back to MLS# extracted from PublicRemarks
  COALESCE(r."ListingId", (regexp_match(r."PublicRemarks", 'MLS#\s*(\d+)'))[1]) AS listing_id,
  COALESCE(r."StandardStatus", r."MlsStatus", r."Status") AS status,
  COALESCE(r."ListPrice", r."SearchPrice"::bigint) AS list_price,
  r."ClosePrice" AS sold_price,
  r."UnparsedAddress" AS address,
  COALESCE(r."StreetNumber", r."AddressNumber") AS street_number,
  COALESCE(r."StreetName", r."AddressStreet") AS street_name,
  NULL::text AS street_suffix,
  r."UnitNumber" AS unit_number,
  r."City" AS city,
  COALESCE(r."StateOrProvince", r."State") AS state,
  COALESCE(r."CountyOrParish", r."County") AS county,
  COALESCE(r."PostalCode", r."Zip") AS zip_code,
  COALESCE(r."BedroomsTotal", r."Bedrooms") AS bedrooms,
  r."BathroomsTotalInteger" AS bathrooms_total,
  COALESCE(r."BathroomsFull", r."NumberofFullBaths"::text) AS bathrooms_full,
  COALESCE(r."BathroomsHalf", r."Numberof1_2Baths"::text) AS bathrooms_half,
  COALESCE(r."BathroomsThreeQuarter", r."Numberof3_4Baths"::text) AS bathrooms_three_quarter,
  COALESCE(r."LivingArea", r."FinishedSQFT"::text) AS square_feet,
  COALESCE(r."LivingArea", r."FinishedSQFT"::text) AS living_area,
  r."LotSizeSquareFeet" AS lot_size_square_feet,
  COALESCE(r."LotSizeAcres", r."NumberofAcres") AS lot_size_acres,
  r."YearBuilt" AS year_built,
  r."PropertyType" AS property_type,
  r."PropertySubType" AS property_sub_type,
  COALESCE(r."ListingContractDate", r."ListingDate"::date) AS listing_date,
  COALESCE(r."CloseDate", r."ClosingDate"::date) AS close_date,
  r."OriginalListPrice" AS original_list_price,
  r."PublicRemarks" AS description,
  COALESCE(r."SubdivisionName", r."Subdivision") AS subdivision_name,
  NULL::text AS mls_area_major,
  r."Neighborhood" AS mls_area_minor,
  NULL::text AS preferred_photo,
  -- Pull Media directly from rc-listings
  r."Media" AS media,
  COALESCE(r."Latitude", r."GeoLatitude"::text) AS latitude,
  COALESCE(r."Longitude", r."GeoLongitude"::text) AS longitude,
  -- Office: prefer RESO, fall back to legacy
  COALESCE(r."ListOfficeName", r."LO1OfficeName") AS list_office_name,
  -- Agent: prefer RESO ListAgentMlsId, fall back to legacy Agent (integer) field
  COALESCE(r."ListAgentMlsId", r."Agent"::text) AS list_agent_mls_id,
  COALESCE(r."ListAgentFirstName", r."LA1AgentFirstName") AS list_agent_first_name,
  COALESCE(r."ListAgentLastName", r."LA1AgentLastName") AS list_agent_last_name,
  COALESCE(r."ListAgentEmail", r."AgentEmail") AS list_agent_email,
  COALESCE(r."ListAgentFullName", CONCAT(r."LA1AgentFirstName", ' ', r."LA1AgentLastName")) AS list_agent_full_name,
  COALESCE(r."CoListAgentMlsId", r."ListingAgent2"::text) AS co_list_agent_mls_id,
  r."BuyerAgentMlsId" AS buyer_agent_mls_id,
  r."CoBuyerAgentMlsId" AS co_buyer_agent_mls_id,
  COALESCE(r."VirtualTourURLUnbranded", r."VirtualTour") AS virtual_tour_url,
  NULL::text AS furnished,
  r."FireplaceYN" AS fireplace_yn,
  r."FireplaceFeatures" AS fireplace_features,
  r."FireplacesTotal" AS fireplace_total,
  r."Cooling" AS cooling,
  r."Heating" AS heating,
  r."LaundryFeatures" AS laundry_features,
  r."AttachedGarageYN" AS attached_garage_yn,
  r."ParkingFeatures" AS parking_features,
  NULL::text[] AS association_amenities,
  -- Open House fields (RESO standard)
  r."OpenHouseDate"::text AS open_house_date,
  r."OpenHouseStartTime"::text AS open_house_start_time,
  r."OpenHouseEndTime"::text AS open_house_end_time,
  r."OpenHouseRemarks" AS open_house_remarks
FROM public."rc-listings" r;

-- Grant read access to the anon role (required for Supabase client)
GRANT SELECT ON public.graphql_listings TO anon;
GRANT SELECT ON public.graphql_listings TO authenticated;
