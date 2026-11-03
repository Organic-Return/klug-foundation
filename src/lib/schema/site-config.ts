/**
 * The one file in src/lib/schema that differs per site. Everything else in
 * the module is shared verbatim between the tenant codebases.
 */
export const siteConfig = {
  /** Path of an agent's profile page for a team member slug. */
  agentProfilePath: (slug: string, _template?: string | null): string => `/real-estate-agent/${slug}`,
  /** The listings search page, for the WebSite SearchAction. */
  searchPath: '/real-estate-for-sale',
};
