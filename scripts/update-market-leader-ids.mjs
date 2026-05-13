import { createClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const sanity = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const supabase = createSupabaseClient(
  process.env.REALOGY_SUPABASE_URL,
  process.env.REALOGY_SUPABASE_ANON_KEY
);

async function updateMarketLeaderIds() {
  // Fetch all market leaders from Sanity
  const partners = await sanity.fetch(
    `*[_type == "affiliatedPartner" && partnerType == "market_leader"]{_id, firstName, lastName, email, agentStaffId}`
  );
  console.log(`Found ${partners.length} market leaders in Sanity`);

  let updated = 0;
  let notFound = 0;

  for (const partner of partners) {
    // Skip if already has a real staff ID (not ml- prefix)
    if (partner.agentStaffId && !partner.agentStaffId.startsWith('ml-')) {
      console.log(`  ${partner.firstName} ${partner.lastName}: already has real ID ${partner.agentStaffId}`);
      continue;
    }

    // Search Realogy DB by name
    const firstName = partner.firstName.split(' ')[0]; // Handle "K. Ann" -> "K."
    const { data: agents, error } = await supabase
      .from('realogy_agents')
      .select('id, rfg_staff_id, entity_id, first_name, last_name, photo_url, email, office_name')
      .ilike('first_name', `${firstName}%`)
      .ilike('last_name', `${partner.lastName}%`)
      .limit(5);

    if (error) {
      console.error(`  Error searching for ${partner.firstName} ${partner.lastName}:`, error.message);
      continue;
    }

    if (!agents || agents.length === 0) {
      // Try by email
      if (partner.email) {
        const { data: byEmail } = await supabase
          .from('realogy_agents')
          .select('id, rfg_staff_id, entity_id, first_name, last_name, photo_url, email, office_name')
          .ilike('email', partner.email)
          .limit(1);

        if (byEmail && byEmail.length > 0) {
          const agent = byEmail[0];
          const staffId = agent.rfg_staff_id || agent.entity_id || agent.id;
          await sanity.patch(partner._id).set({ agentStaffId: staffId }).commit();
          console.log(`  ${partner.firstName} ${partner.lastName}: matched by email -> ${staffId}`);
          updated++;
          continue;
        }
      }
      console.log(`  ${partner.firstName} ${partner.lastName}: NOT FOUND`);
      notFound++;
      continue;
    }

    // Use best match
    const agent = agents[0];
    const staffId = agent.rfg_staff_id || agent.entity_id || agent.id;
    await sanity.patch(partner._id).set({ agentStaffId: staffId }).commit();
    console.log(`  ${partner.firstName} ${partner.lastName}: -> ${staffId} (${agent.first_name} ${agent.last_name}, ${agent.office_name})`);
    updated++;
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
}

updateMarketLeaderIds().catch(console.error);
