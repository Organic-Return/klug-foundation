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