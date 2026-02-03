import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "1zb39xqr",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true, // Enable CDN for faster reads
  perspective: 'published',
  stega: {
    enabled: false,
  },
});

// Write client for mutations (requires SANITY_API_TOKEN env var)
export const writeClient = createClient({
  projectId: "1zb39xqr",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false, // Don't use CDN for writes
  token: process.env.SANITY_API_TOKEN,
});