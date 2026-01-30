import { client } from '@/sanity/client';

interface MegaMenuLink {
  label: string;
  url: string;
  description?: string;
  openInNewTab?: boolean;
}

interface MegaMenuColumn {
  title?: string;
  links?: MegaMenuLink[];
  featuredImage?: any;
}

interface DropdownLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

interface NavItem {
  label: string;
  url?: string;
  openInNewTab?: boolean;
  hasMegaMenu?: boolean;
  megaMenuColumns?: MegaMenuColumn[];
  simpleDropdown?: DropdownLink[];
}

interface Navigation {
  title?: string;
  identifier?: string;
  items?: NavItem[];
}

const NAVIGATION_QUERY = `*[_type == "navigation" && identifier == $identifier][0]{
  title,
  identifier,
  items
}`;

/**
 * Fetches navigation data from Sanity by identifier
 * @param identifier - The navigation identifier (e.g., 'main', 'footer')
 * @returns Navigation data or null
 */
export async function getNavigation(identifier: string): Promise<Navigation | null> {
  try {
    const navigation = await client.fetch<Navigation>(
      NAVIGATION_QUERY,
      { identifier },
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );
    return navigation || null;
  } catch (error) {
    console.error(`Error fetching navigation (${identifier}):`, error);
    return null;
  }
}

/**
 * Fetches main navigation for header
 */
export async function getMainNavigation(): Promise<NavItem[]> {
  const navigation = await getNavigation('main');
  return navigation?.items || [];
}

/**
 * Fetches footer navigation
 */
export async function getFooterNavigation(): Promise<NavItem[]> {
  const navigation = await getNavigation('footer');
  return navigation?.items || [];
}

/**
 * Groups footer navigation items into columns for footer layout
 * Useful for organizing footer links into categorized columns
 */
export function groupFooterLinks(navItems: NavItem[]): Array<{
  title?: string;
  links?: Array<{
    label: string;
    url: string;
    openInNewTab?: boolean;
  }>;
}> {
  return navItems.map((item) => {
    // If item has dropdown links, use those as the column links
    if (item.simpleDropdown && item.simpleDropdown.length > 0) {
      return {
        title: item.label,
        links: item.simpleDropdown,
      };
    }

    // If item has mega menu, flatten the links from all columns
    if (item.hasMegaMenu && item.megaMenuColumns) {
      const allLinks: Array<{
        label: string;
        url: string;
        openInNewTab?: boolean;
      }> = [];

      item.megaMenuColumns.forEach((column) => {
        if (column.links) {
          allLinks.push(...column.links);
        }
      });

      return {
        title: item.label,
        links: allLinks,
      };
    }

    // If item is a simple link, return it as a single-item column
    if (item.url) {
      return {
        title: undefined,
        links: [
          {
            label: item.label,
            url: item.url,
            openInNewTab: item.openInNewTab,
          },
        ],
      };
    }

    // Default: empty column
    return {
      title: item.label,
      links: [],
    };
  });
}
