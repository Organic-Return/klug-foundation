import { NextResponse } from 'next/server';
import { client } from '@/sanity/client';

interface Neighborhood {
  name: string;
  slug: { current: string };
  description?: string;
  image?: {
    asset: {
      url: string;
    };
  };
  communitySlug: string;
  communityTitle: string;
}

const NEIGHBORHOODS_QUERY = `*[_type == "community" && defined(neighborhoods) && count(neighborhoods) > 0]{
  "communitySlug": slug.current,
  "communityTitle": title,
  neighborhoods[]{
    name,
    slug,
    description,
    image {
      asset-> {
        url
      }
    }
  }
}`;

export async function GET() {
  try {
    const communities = await client.fetch(
      NEIGHBORHOODS_QUERY,
      {},
      { next: { revalidate: 60 } }
    );

    // Flatten neighborhoods from all communities
    const neighborhoods: Neighborhood[] = [];

    for (const community of communities || []) {
      if (community.neighborhoods) {
        for (const neighborhood of community.neighborhoods) {
          neighborhoods.push({
            ...neighborhood,
            communitySlug: community.communitySlug,
            communityTitle: community.communityTitle,
          });
        }
      }
    }

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error('Error fetching community neighborhoods:', error);
    return NextResponse.json({ neighborhoods: [] }, { status: 500 });
  }
}
