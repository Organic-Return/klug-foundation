import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ujo0cv7k',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const marketLeaders = [
  { firstName: "Dusty", lastName: "Baker", email: "dusty@dustybakergroup.com", phone: "805-570-0102", company: "Sotheby's International Realty", location: "Santa Barbara & Montecito, CA", website: "https://www.dustybakergroup.com/" },
  { firstName: "Josh", lastName: "Behr", email: "josh@thebehrteam.com", phone: "303-903-9535", company: "LIV Sotheby's International Realty", location: "Denver, CO", website: "https://behrteam.com/" },
  { firstName: "Walter", lastName: "Bering", email: "walter.bering@sothebys.realty", phone: "713-851-9753", company: "Sotheby's International Realty", location: "Houston, TX", website: "http://www.walterbering.com/" },
  { firstName: "Matthew", lastName: "Blake", email: "mblake@livsothebysrealty.com", phone: "970-390-2692", company: "LIV Sotheby's International Realty", location: "Vail, CO", website: "https://mattblakerealestate.com/" },
  { firstName: "K. Ann", lastName: "Brizolis", email: "ann@brizolisjanzen.com", phone: "858-945-5100", company: "Pacific Sotheby's International Realty", location: "Rancho Santa Fe/San Diego, CA", website: "https://www.kabrizolis.com/" },
  { firstName: "Jessica", lastName: "Canning", email: "jessica@canningproperties.com", phone: "831-238-5535", company: "Sotheby's International Realty", location: "Carmel & Pebble Beach, CA", website: "https://www.canningproperties.com/" },
  { firstName: "Dennis", lastName: "Carvajal", email: "dcarvajal@onesothebysrealty.com", phone: "786-255-3334", company: "ONE Sotheby's International Realty", location: "Miami & Coral Gables, FL", website: "https://www.miamiluxuryliving.com/" },
  { firstName: "Joe", lastName: "Cilic", email: "joe.cilic@sir.com", phone: "310-925-1402", company: "Sotheby's International Realty", location: "Los Angeles, CA", website: "https://www.cilicgroup.com/" },
  { firstName: "Mayi", lastName: "de la Vega", email: "mayi@onesothebysrealty.com", phone: "305-790-6294", company: "ONE Sotheby's International Realty", location: "Miami, FL", website: "http://www.mayidelavega.com/" },
  { firstName: "Beth", lastName: "Dickerson", email: "dickersonre1@yahoo.com", phone: "617-510-8565", company: "Gibson Sotheby's International Realty", location: "Boston, MA", website: "https://www.bethdickerson.com/" },
  { firstName: "Dan", lastName: "Dockray", email: "dan.dockray@sothebysrealty.com", phone: "970-708-0666", company: "LIV Sotheby's International Realty", location: "Telluride, CO", website: "https://www.dandockray.com/" },
  { firstName: "Michael", lastName: "Dreyfus", email: "m.dreyfus@ggsir.com", phone: "650-704-7928", company: "Golden Gate Sotheby's International Realty", location: "Silicon Valley, CA", website: "https://www.dreyfus.group/" },
  { firstName: "Nikki", lastName: "Field", email: "nikki.field@sothebys.realty", phone: "212-606-7669", company: "Sotheby's International Realty", location: "New York, NY", website: "https://nikkifield.com/" },
  { firstName: "Amanda", lastName: "Field Jordan", email: "amanda.jordan@sothebys.realty", phone: "212-606-7798", company: "Sotheby's International Realty", location: "New York, NY", website: "https://amandajordanrealestate.com/" },
  { firstName: "Jennifer", lastName: "Gilson", email: "jenn@jenngilson.com", phone: "650-642-6957", company: "Golden Gate Sotheby's International Realty", location: "San Francisco Peninsula, CA", website: "https://jenngilson.com/" },
  { firstName: "Becky", lastName: "Gray", email: "becky.gray@rsir.com", phone: "206-605-1927", company: "Realogics Sotheby's International Realty", location: "Seattle, WA", website: "https://www.thegrayteam.com/" },
  { firstName: "Daniel", lastName: "Heider", email: "daniel@danielheider.com", phone: "703-785-7820", company: "TTR Sotheby's International Realty", location: "Washington, DC", website: "https://danielheider.com/" },
  { firstName: "Lauren", lastName: "Holleran", email: "lauren.holleran@sothebysrealty.com", phone: "617-913-2203", company: "Gibson Sotheby's International Realty", location: "Cambridge, MA", website: "https://www.laurenholleran.com/" },
  { firstName: "Moira E.", lastName: "Holley", email: "moira@moirapresents.com", phone: "206-612-5771", company: "Realogics Sotheby's International Realty", location: "Seattle & The San Juan Islands, WA", website: "https://moirapresents.com/" },
  { firstName: "Chris", lastName: "Klug", email: "chris@klugproperties.com", phone: "970-948-7055", company: "Aspen Snowmass Sotheby's International Realty", location: "Aspen, CO", website: "https://klugproperties.com/" },
  { firstName: "Gregg", lastName: "Lynn", email: "gregg.lynn@sir.com", phone: "415-901-1780", company: "Sotheby's International Realty", location: "San Francisco, CA", website: "http://www.gregglynn.com/" },
  { firstName: "Ryan", lastName: "MacLaughlin", email: "ryan@islandsothebysrealty.com", phone: "808-283-7965", company: "Island Sotheby's International Realty", location: "Maui, HI", website: "https://www.hawaiirealestatesearch.com/" },
  { firstName: "Peter", lastName: "Mahler", email: "pmahler@mahlerent.com", phone: "414-847-3100", company: "Mahler Sotheby's International Realty", location: "Milwaukee, WI", website: "https://www.mahlersir.com/" },
  { firstName: "Leslie", lastName: "McElwreath", email: "leslie.mcelwreath@sothebys.realty", phone: "917-539-3654", company: "Sotheby's International Realty", location: "Greenwich, CT", website: "http://www.lesliemcelwreath.com/" },
  { firstName: "Chandra", lastName: "Miller", email: "chandra@maurypeople.com", phone: "508-360-7777", company: "Maury People Sotheby's International Realty", location: "Nantucket, MA", website: "https://chandramiller.com/" },
  { firstName: "Chase", lastName: "Mizell", email: "chasemizell@atlantafinehomes.com", phone: "770-289-2780", company: "Atlanta Fine Homes Sotheby's International Realty", location: "Atlanta, GA", website: "https://chasemizell.com/" },
  { firstName: "Ann", lastName: "Newton Cane", email: "a.newtoncane@ggsir.com", phone: "415-999-0253", company: "Golden Gate Sotheby's International Realty", location: "East Bay, CA", website: "https://annnewtoncane.com/" },
  { firstName: "Marc", lastName: "Noah", email: "marc@marcnoah.com", phone: "310-968-9212", company: "Sotheby's International Realty", location: "Los Angeles, CA", website: "https://www.marcnoah.com/" },
  { firstName: "Marcus", lastName: "O'Brien", email: "mob@sothebysrealty.co.uk", phone: "44 7825 170317", company: "United Kingdom Sotheby's International Realty", location: "United Kingdom", website: "https://www.sothebysrealty.com/eng/associate/180-a-df2311240712106913/marcus-obrien" },
  { firstName: "Frances", lastName: "Peter", email: "frances.peter@sothebys.realty", phone: "561-273-6128", company: "Sotheby's International Realty", location: "Palm Beach, FL", website: "http://www.francesandtodd.com/" },
  { firstName: "Todd", lastName: "Peter", email: "todd.peter@sothebys.realty", phone: "561-281-0031", company: "Sotheby's International Realty", location: "Palm Beach, FL", website: "http://www.francesandtodd.com/" },
  { firstName: "Ryan", lastName: "Preuett", email: "ryan.preuett@sothebysrealty.com", phone: "312-371-5951", company: "Jameson Sotheby's International Realty", location: "Chicago, IL", website: "https://www.ryanpreuett.com/" },
  { firstName: "Michael", lastName: "Rankin", email: "mrankin@ttrsir.com", phone: "202-271-3344", company: "TTR Sotheby's International Realty", location: "Washington, DC", website: "https://michaelrankin.ttrsir.com/eng" },
  { firstName: "Hillary", lastName: "Ryan", email: "hillary@hillaryryangroup.com", phone: "707-312-2105", company: "Sotheby's International Realty", location: "Napa Valley, CA", website: "https://www.hillaryryangroup.com/" },
  { firstName: "Tim", lastName: "Salm", email: "tsalm@jamesonsir.com", phone: "312-545-6753", company: "Jameson Sotheby's International Realty", location: "Chicago, IL", website: "https://www.timsalm.com/" },
  { firstName: "Sean", lastName: "Stanfield", email: "sean@stanfieldrealestate.com", phone: "949-244-9057", company: "Pacific Sotheby's International Realty", location: "Orange County & Palm Springs, CA", website: "https://www.stanfieldrealestate.com/" },
  { firstName: "Jeremy", lastName: "Stein", email: "jeremy.stein@sothebys.realty", phone: "917-854-4411", company: "Sotheby's International Realty", location: "New York, NY", website: "http://www.steinnewyork.com/" },
  { firstName: "Andrew", lastName: "Tanner", email: "andrew.tanner@premiersir.com", phone: "941-539-0998", company: "Premier Sotheby's International Realty", location: "Sarasota, FL", website: "https://laughlintanner.com/agent/andrew-tanner" },
  { firstName: "Andy", lastName: "Taylor", email: "andytaylor@sothebysrealty.ca", phone: "416-994-2118", company: "Canada Sotheby's International Realty", location: "Toronto, Ontario, CA", website: "https://torontoluxuryhome.ca/" },
  { firstName: "Michelle", lastName: "Thomas", email: "michelle.thomas@premiersir.com", phone: "239-860-7176", company: "Premier Sotheby's International Realty", location: "Naples & Marco Island, FL", website: "https://www.michellethomasteam.com/" },
  { firstName: "Jorge", lastName: "Uribe", email: "Jorge@jorgeuribe.com", phone: "786-371-8777", company: "ONE Sotheby's International Realty", location: "Miami, FL", website: "http://www.jorgeuribe.com/" },
  { firstName: "Tim", lastName: "Van Camp", email: "tim.vancamp@sothebys.realty", phone: "505-690-2750", company: "Sotheby's International Realty", location: "Santa Fe, NM", website: "http://www.knowingsantafe.com/" },
  { firstName: "Kumara", lastName: "Wilcoxon", email: "kumarawilcoxon@gmail.com", phone: "512-423-5035", company: "Kuper Sotheby's International Realty", location: "Austin, TX", website: "https://kumara.kuperrealty.com/" },
  { firstName: "Marilyn", lastName: "Wright", email: "marilyn.wright@premiersir.com", phone: "828-279-3980", company: "Premier Sotheby's International Realty", location: "Asheville, NC", website: "https://marilynwright.premiersothebysrealty.com" },
  { firstName: "Thomas", lastName: "Wright", email: "thomas@thomasewright.com", phone: "801-652-5700", company: "Summit Sotheby's International Realty", location: "Park City & Salt Lake City, UT", website: "http://thomaswrightrealestate.com/" },
  { firstName: "Andrea", lastName: "Hawk", email: "andrea@andreahawk.com", phone: "727-409-7152", company: "", location: "St. Petersburg, FL", website: "" },
  { firstName: "Amy", lastName: "Mittlemann", email: "amy.mittlemann@i2eyemedia.com", phone: "650-804-2778", company: "", location: "", website: "" },
];

async function seedMarketLeaders() {
  console.log(`Seeding ${marketLeaders.length} market leaders...`);

  // Check for existing partners to avoid duplicates
  const existing = await client.fetch(
    `*[_type == "affiliatedPartner" && partnerType == "market_leader"]{email}`
  );
  const existingEmails = new Set(existing.map(e => e.email?.toLowerCase()));

  let created = 0;
  let skipped = 0;

  for (const agent of marketLeaders) {
    if (existingEmails.has(agent.email.toLowerCase())) {
      console.log(`  Skipping ${agent.firstName} ${agent.lastName} (already exists)`);
      skipped++;
      continue;
    }

    const slugBase = `${agent.firstName}-${agent.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const doc = {
      _type: 'affiliatedPartner',
      partnerType: 'market_leader',
      agentStaffId: `ml-${slugBase}`,
      firstName: agent.firstName.trim(),
      lastName: agent.lastName.trim(),
      slug: { _type: 'slug', current: slugBase },
      company: agent.company || undefined,
      location: agent.location || undefined,
      email: agent.email.trim(),
      phone: agent.phone || undefined,
      website: agent.website || undefined,
      active: true,
      featured: false,
      sortOrder: 0,
    };

    try {
      const result = await client.create(doc);
      console.log(`  Created: ${agent.firstName} ${agent.lastName} (${result._id})`);
      created++;
    } catch (err) {
      console.error(`  Error creating ${agent.firstName} ${agent.lastName}:`, err.message);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

seedMarketLeaders().catch(console.error);
