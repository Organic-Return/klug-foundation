import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "1zb39xqr";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true, // Enable CDN for faster reads
  perspective: 'published',
  stega: {
    enabled: false,
  },
});

// Write client for mutations (requires SANITY_API_TOKEN env var)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false, // Don't use CDN for writes
  token: process.env.SANITY_API_TOKEN,
});