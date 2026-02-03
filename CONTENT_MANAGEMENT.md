# Content Management Guide

This guide explains how to manage all content on the Real Estate Website using Sanity Studio.

## Accessing Sanity Studio

**Local Development:**
```bash
npm run dev
```
Then visit: `http://localhost:3000/studio`

**Production:** `https://yourdomain.com/studio`

---

## Content Types Overview

| Content Type | Purpose | Location in Studio |
|-------------|---------|-------------------|
| Homepage | Main landing page configuration | Top of sidebar |
| Site Settings | Global settings, branding, API keys | Top of sidebar |
| Post | Blog articles | Content list |
| Community | Neighborhood/city profiles | Content list |
| Team Member | Agent profiles | Content list |
| Publication | Market reports, magazines | Content list |
| Navigation | Site menus | Content list |
| Why Klug Properties | About page content | Content list |
| Testimonials Page | Client testimonials | Content list |
| Affiliated Partner | Partner agent profiles | Content list |
| Affiliated Partners Page | Partner directory pages | Content list |
| Off Market Listing | Properties not in MLS | Content list |
| Property Enhancement | Videos/docs for MLS properties | Content list |
| MLS Configuration | Filter which MLS listings appear | Content list |

---

## Singleton Documents (One Instance Only)

### Homepage

Controls the entire landing page. Sections include:

**Hero Section**
- Upload background video (Mux) or fallback image
- Toggle search form visibility
- Set hero title text

**Team Section**
- Select featured team member
- Choose positioning (left/right)

**Accolades Section**
- Add up to 12 achievement stats
- Each can be: number, number with prefix, or image
- Example: "$500M+" with label "In Sales Volume"

**Featured Property**
- Enter MLS Number to showcase a single property
- Customize button text

**Featured Properties Carousel**
- Select cities to show newest high-priced listings
- Properties auto-populate from MLS data

**Featured Communities**
- Choose to show all or select specific communities
- Links to community detail pages

**Market Stats Section**
- Enable/disable the section
- Select which cities to display stats for
- Available cities: Aspen, Snowmass Village, Basalt, Carbondale, Glenwood Springs, etc.

**SEO Settings**
- Meta title and description
- Open Graph image
- Keywords

---

### Site Settings

Global configuration for the entire site.

**Template Selection**
- Classic (Klug Custom)
- Luxury
- Modern

**Branding**
- Logo image
- Favicon
- Apple touch icon

**API Keys** (can also be set in .env.local)
- Census API Key
- YouTube API Key & Channel ID
- Google Maps API Key
- Google Analytics ID
- Google Tag Manager ID
- Google Ads Conversion ID & Label
- Facebook Pixel ID

**Social Media Links**
- Facebook, Instagram, Twitter/X, LinkedIn, YouTube

**Contact Information**
- Email, phone, address

**Default SEO**
- Default meta image
- Site-wide keywords

**Footer Settings**
- Portrait image
- Tagline/logo image
- Brokerage logo

---

## Regular Content Documents

### Posts (Blog)

Create blog articles with:
- Title and auto-generated slug
- Main image with hotspot cropping
- Rich text body supporting:
  - Headings (H1, H2, H3)
  - Block quotes
  - Bullet and numbered lists
  - Links
  - Embedded images
  - Mux videos
  - Code blocks
- Published date
- SEO metadata

---

### Communities

Detailed neighborhood/city profiles.

**Basic Info**
- Name, slug, type (city/neighborhood/complex)

**MLS Linking**
- Select MLS Neighborhood (dropdown populated from MLS data)
- Select Subdivision/Complex Name (dropdown populated from MLS data)

**Demographics** (auto-populated from Census API)
- Population, households, median age
- Median income, education stats
- Housing data, elevation

**Price Range**
- Set min/max prices for the community

**Amenities**
- Tag-based list (pool, golf, hiking, etc.)

**Description**
- Rich text content about the community

**Nearby Schools**
- Add schools with name, type, rating (1-10), distance, address, website

**Nearby Attractions**
- Add restaurants, parks, shopping, etc.
- Categories: restaurant, shopping, park, entertainment, fitness, healthcare, grocery, coffee, museum, outdoor, other

**Status**
- Active, Coming Soon, or Sold Out

**Featured Flag**
- Mark to show in featured communities section

---

### Team Members

Agent/team member profiles:
- Name and title
- Biography
- Professional photo
- Contact info (email, phone, mobile, office)
- Office address
- Social media links
- Display order (for sorting)
- Featured on homepage flag

---

### Publications

Market reports and magazines:
- Title and slug
- Type: Magazine or Market Report
- Header image
- Excerpt
- PDF file upload
- Rich text content
- Published date
- Featured flag
- SEO metadata

---

### Navigation

Configure site menus:

**Main Navigation**
- Create with identifier: `main`
- Add navigation items with labels and URLs
- Enable mega menu for complex dropdowns:
  - Columns with titles, subtitles, and link lists
  - Featured images per column

**Footer Navigation**
- Create with identifier: `footer`
- Add footer link groups

---

### Why Klug Properties (About Page)

Configure the about/company page:
- Hero section with title, subtitle, background
- Introduction with rich text
- Services/differentiators with icons
- Marketing approach section
- Statistics display
- Process steps
- Testimonials
- Call to action

---

### Testimonials Page

Dedicated testimonials page:
- Hero section
- Introduction
- Featured testimonial (highlighted)
- Testimonials grid
- Video testimonials (YouTube/Vimeo)
- Statistics section
- CTA section

---

### Affiliated Partners

Partner agent profiles:
- Partner type: Ski Town or Market Leader
- Search and select from database of agents
- Override photo and bio if needed
- Location with coordinates for map display
- Contact information
- Specialties tags
- Sort order and featured flag

---

### Affiliated Partners Page

Landing pages for partner directories:
- Page type: Main Landing, Ski Town Partners, or Market Leaders
- Hero section
- Category cards (main page only)
- Featured section
- CTA with contact modal option

---

### Off Market Listings

Properties not in MLS:
- Full property details (beds, baths, sqft, lot size)
- Address and location with coordinates
- Photos and virtual tour
- Status: Active, Pending, Closed, Coming Soon
- Agent information
- Featured flag
- Registration requirement option

---

### Property Enhancement

Add videos and documents to MLS properties:

**How to Use:**
1. Find the MLS Number of the property you want to enhance
2. Create a new Property Enhancement document
3. Enter the MLS Number
4. Add videos and/or documents

**Video Types Supported:**
- Mux (upload directly)
- YouTube (enter video ID)
- Vimeo (enter video ID)
- External URL (direct video link)

**Document Types:**
- Floor Plan
- Brochure
- Survey
- Disclosures
- HOA Documents
- Inspection Report
- Other

Videos and documents automatically appear on the listing detail page.

---

### MLS Configuration

Control which MLS listings appear on the site:

**Excluded Property Types**
- Commercial Land, Commercial Lease, Commercial Sale
- Fractional, RES Vacant Land
- Residential, Residential Lease

**Excluded Property Subtypes**
- Agricultural, Business with Real Estate, Commercial
- Condominium, Duplex, Half Duplex
- Mobile Home, Townhouse, etc.

**Allowed Cities**
- Whitelist specific cities to display
- Aspen, Basalt, Carbondale, Snowmass Village, etc.

**Excluded Statuses**
- Active, Active Under Contract, Closed, Pending

---

## MLS Data vs Sanity Content

### MLS Data (Read-Only)
- Property listings come from third-party MLS feed
- Data stored in Supabase database
- Updates automatically from MLS source
- Cannot edit individual listings in Sanity

### Sanity Content (Editable)
- All content types listed above
- Full control over content
- Changes publish immediately

### Integration Points
1. **Homepage** pulls featured properties from MLS by city
2. **Communities** link to MLS neighborhoods for listing counts
3. **Property Enhancement** adds rich media to MLS listings
4. **MLS Configuration** filters which MLS listings appear

---

## Environment Variables

Set these in `.env.local` for local development or in your hosting platform (Vercel) for production:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional - can also be set in Site Settings
CENSUS_API_KEY=your_census_api_key
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_channel_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id
```

---

## Common Tasks

### Add a New Blog Post
1. Go to Studio > Post
2. Click "Create new Post"
3. Fill in title, content, image
4. Set published date
5. Publish

### Feature a Property on Homepage
1. Go to Studio > Homepage
2. Find "Featured Property" section
3. Enter the MLS Number
4. Save

### Add Video to a Listing
1. Go to Studio > Property Enhancement
2. Click "Create new Property Enhancement"
3. Enter the MLS Number of the property
4. Add videos (YouTube, Vimeo, Mux, or external URL)
5. Save

### Update Navigation Menu
1. Go to Studio > Navigation
2. Find the navigation with identifier "main"
3. Edit navigation items
4. For mega menus, enable the toggle and configure columns
5. Save

### Create a New Community Page
1. Go to Studio > Community
2. Click "Create new Community"
3. Fill in name, select type (city/neighborhood/complex)
4. Link to MLS area for automatic listing association
5. Add schools, attractions, amenities
6. Save

### Change Site Template
1. Go to Studio > Site Settings
2. Find "Site Template" section
3. Select Classic, Luxury, or Modern
4. Save (changes apply site-wide)

### Hide Certain Property Types
1. Go to Studio > MLS Configuration
2. Check the property types to exclude
3. Save (listings update immediately)

---

## Tips

- **Images**: Use high-quality images. Hotspot cropping lets you control focal points.
- **SEO**: Fill in meta titles and descriptions for better search rankings.
- **Preview**: Use the Vision tool in Studio to test GROQ queries.
- **Videos**: Mux provides best performance; YouTube/Vimeo are good alternatives.
- **Order**: Use display order fields to control how items appear in lists.
- **Featured Flags**: Use these to highlight important content on the homepage.
