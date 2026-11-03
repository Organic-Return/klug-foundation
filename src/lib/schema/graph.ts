/**
 * Assembling and serialising a JSON-LD @graph.
 *
 * Builders return nodes with whatever data they were given; `compact` strips
 * every property whose value is missing (undefined, null, '', empty array or
 * empty object) so the output never carries placeholders. `serializeJsonLd`
 * escapes the characters that could end a <script> element early.
 */

export type JsonLdNode = { '@type': string | string[]; '@id'?: string } & Record<string, unknown>;

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/** Recursively removes empty values. Objects that end up empty are removed too. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value.map((item) => compact(item)).filter((item) => !isEmpty(item));
    return items as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = compact(raw);
      if (!isEmpty(cleaned)) out[key] = cleaned;
    }
    return out as T;
  }
  if (typeof value === 'string') return value.trim() as unknown as T;
  return value;
}

/**
 * Builds one @graph from a list of nodes. Falsy entries are dropped (so a
 * builder can return undefined when it has nothing to say) and nodes that
 * share an @id are merged, later properties filling gaps in earlier ones.
 */
export function buildGraph(nodes: Array<JsonLdNode | JsonLdNode[] | null | undefined | false>): JsonLdGraph {
  const byId = new Map<string, JsonLdNode>();
  const graph: JsonLdNode[] = [];
  for (const entry of nodes.flat()) {
    if (!entry) continue;
    const node = compact(entry) as JsonLdNode;
    if (!node['@type']) continue;
    const id = node['@id'];
    if (id && byId.has(id)) {
      const existing = byId.get(id)!;
      for (const [key, value] of Object.entries(node)) {
        if (existing[key] === undefined) existing[key] = value;
      }
      continue;
    }
    if (id) byId.set(id, node);
    graph.push(node);
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * JSON for embedding inside <script type="application/ld+json">. The HTML
 * parser does not decode entities inside <script>, so the only safe approach
 * is to escape the characters that can form "</script>" or break the parse.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
