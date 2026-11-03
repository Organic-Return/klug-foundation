import { buildGraph, serializeJsonLd, type JsonLdNode } from '@/lib/schema';

interface SchemaGraphProps {
  /** Nodes for this page. Falsy entries and empty properties are dropped. */
  nodes: Array<JsonLdNode | JsonLdNode[] | null | undefined | false>;
}

/**
 * One <script type="application/ld+json"> holding a schema.org @graph.
 * Server component: the JSON is in the initial HTML. The root layout renders
 * the sitewide graph (business, agent, website); pages render their own.
 */
export default function SchemaGraph({ nodes }: SchemaGraphProps) {
  const graph = buildGraph(nodes);
  if (graph['@graph'].length === 0) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />;
}
