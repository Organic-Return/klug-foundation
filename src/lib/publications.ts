export interface PublicationSummary {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  headerImage?: unknown;
}

/**
 * The publications nearest in time to the current one: half before, half
 * after, filled from whichever side runs out. "Newest six" linked the same
 * six issues from every page and left the older ones reachable only from
 * the index; neighbours give every issue inbound links from the issues
 * around it.
 */
export function pickNeighbours<T extends { slug: { current: string }; publishedAt: string }>(
  items: T[],
  currentSlug: string,
  count = 6
): T[] {
  const sorted = [...items].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  const index = sorted.findIndex((i) => i.slug?.current === currentSlug);
  const others = sorted.filter((i) => i.slug?.current !== currentSlug);
  if (index < 0) return others.slice(0, count);
  const newer = sorted.slice(0, index).reverse();
  const older = sorted.slice(index + 1);
  const picks: T[] = [];
  let n = 0;
  let o = 0;
  while (picks.length < count && (n < newer.length || o < older.length)) {
    if (n < newer.length) picks.push(newer[n++]);
    if (picks.length < count && o < older.length) picks.push(older[o++]);
  }
  return picks.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}
