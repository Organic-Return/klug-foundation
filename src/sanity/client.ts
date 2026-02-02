import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "ujo0cv7k",
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
  projectId: "ujo0cv7k",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false, // Don't use CDN for writes
  token: process.env.SANITY_API_TOKEN,
});