import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TeamMemberPage, { generateMetadata as teamMemberMeta } from "@/app/team/[slug]/page";
import SkiTownPartnerPage, { generateMetadata as skiTownMeta } from "@/app/affiliated-partners/ski-town/[slug]/page";
import MarketLeaderPage, { generateMetadata as marketLeaderMeta } from "@/app/affiliated-partners/market-leaders/[slug]/page";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

type AgentKind = "team" | "ski-town" | "market-leader" | null;

const RESOLVE_QUERY = `
  *[
    (_type == "teamMember" && slug.current == $slug && inactive != true) ||
    (_type == "affiliatedPartner" && active == true && (slug.current == $slug || lower(firstName + "-" + lastName) == $slug))
  ][0] {
    _type,
    "partnerType": partnerType
  }
`;

async function resolveAgentKind(slug: string): Promise<AgentKind> {
  const result = await client.fetch<{ _type: string; partnerType?: string } | null>(
    RESOLVE_QUERY,
    { slug },
    { next: { revalidate: 60 } }
  );
  if (!result) return null;
  if (result._type === "teamMember") return "team";
  if (result.partnerType === "ski_town") return "ski-town";
  if (result.partnerType === "market_leader") return "market-leader";
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const kind = await resolveAgentKind(slug);
  if (kind === "team") return teamMemberMeta(props);
  if (kind === "ski-town") return skiTownMeta(props);
  if (kind === "market-leader") return marketLeaderMeta(props);
  return { title: "Agent Not Found" };
}

export default async function RealEstateAgentPage(props: Props) {
  const { slug } = await props.params;
  const kind = await resolveAgentKind(slug);
  if (kind === "team") return TeamMemberPage(props);
  if (kind === "ski-town") return SkiTownPartnerPage(props);
  if (kind === "market-leader") return MarketLeaderPage(props);
  notFound();
}
