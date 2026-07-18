export const metadata = {
  title: 'Maharaja Trails — Indian Virtual',
  description: 'Maharaja Trails: fourteen hand-picked flight itineraries across the Air India Group network on Infinite Flight — chained mountain circuits, tech-stop long-hauls, a round-the-world A380 chase, and more, each with a suggested flight plan.',
  keywords: ['Indian Virtual trails', 'Air India virtual routes', 'Infinite Flight themed routes', 'INVA route collections', 'virtual airline flight itinerary'],
  openGraph: {
    title: 'Maharaja Trails | Indian Virtual',
    description: 'Fourteen hand-picked route itineraries across the Air India Group network — real chained legs, suggested departure times, and a story behind every one.',
    url: 'https://indianvirtual.site/operations/trails',
  },
  alternates: { canonical: 'https://indianvirtual.site/operations/trails' },
}

import Image from 'next/image'
import {
  FaCrown,
  FaMountain,
  FaClockRotateLeft,
  FaSun,
  FaEarthOceania,
  FaLandmark,
  FaPlaneUp,
  FaEarthAmericas,
  FaRoute,
  FaTree,
  FaCompass,
  FaTriangleExclamation,
  FaBoxesPacking,
} from 'react-icons/fa6'

// ─── Data ─────────────────────────────────────────────────────────────────────
// Every leg below is a real row from the INVA `routes` table. Where a trail is
// marked `sequenced`, its legs were chosen because one leg's arrival airport is
// the next leg's departure airport in the actual data — these are flyable,
// back-to-back itineraries, not a random sample. Suggested times are curatorial
// (the routes table carries no schedule), chosen to be operationally sensible.

const TRAILS = [
  {
    id: 'durbar',
    name: 'The Durbar Day Shuttle',
    tagline: 'A day in the life of the trunk network.',
    icon: FaCrown,
    color: '#2b4bee',
    bg: '#EFF3FF',
    border: '#C7D2FE',
    region: 'Domestic India · Sequenced',
    stat: '4 legs · 8h50m duty',
    sequenced: true,
    description:
      "Every real airline runs its narrowbodies hard, and Air India's domestic A320 family is no exception. This is one aircraft's plausible duty day on the trunk network — four sectors, three quick turns, and a return to base before evening. Fly it exactly as scheduled below, or use it as a template for your own multi-sector duty day.",
    itinerary: [
      '06:00 IST — Depart Delhi (VIDP)',
      '08:00 — Arrive Mumbai (VABB) · 45m turn',
      '08:45 — Depart Mumbai',
      '10:05 — Arrive Bengaluru (VOBL) · 45m turn',
      '10:50 — Depart Bengaluru',
      '11:50 — Arrive Chennai (VOMM) · 45m turn',
      '12:35 — Depart Chennai',
      '14:50 — Arrive back at Delhi (VIDP)',
    ],
    legs: [
      { fn: 'AI2995', from: 'Delhi', to: 'Mumbai', ac: 'A320/A321', block: '02:00' },
      { fn: 'AI603', from: 'Mumbai', to: 'Bengaluru', ac: 'A320', block: '01:20' },
      { fn: 'AI525', from: 'Bengaluru', to: 'Chennai', ac: 'A320', block: '01:00' },
      { fn: 'AI538', from: 'Chennai', to: 'Delhi', ac: 'A320/A321', block: '02:15' },
    ],
  },
  {
    id: 'himalayan',
    name: 'The Himalayan Frontier Circuit',
    tagline: 'A morning window, four thin-air landings.',
    icon: FaMountain,
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    region: 'Domestic India · Sequenced',
    stat: '4 legs · 6h00m loop',
    sequenced: true,
    description:
      "Leh sits at 10,682 feet, ringed by peaks over 20,000, and in the real world it's a morning-only airport — thermal turbulence off the mountains makes afternoon approaches too rough to schedule. This circuit respects that constraint. All four legs are flown before noon: Delhi up onto the Ladakh plateau, over to Srinagar's Kashmir valley, down to Jammu, and back to the plains — a complete tour of India's most demanding domestic terrain in one sitting.",
    itinerary: [
      '06:00 IST — Depart Delhi (VIDP)',
      '07:15 — Arrive Leh (VILH) · 40m turn',
      '07:55 — Depart Leh',
      '08:35 — Arrive Srinagar (VISR) · 40m turn',
      '09:15 — Depart Srinagar',
      '10:05 — Arrive Jammu (VIJU) · 40m turn',
      '10:45 — Depart Jammu',
      '12:00 — Arrive back at Delhi (VIDP)',
    ],
    legs: [
      { fn: 'AI445', from: 'Delhi', to: 'Leh', ac: 'A320', block: '01:15' },
      { fn: 'AI448', from: 'Leh', to: 'Srinagar', ac: 'A320', block: '00:40' },
      { fn: 'IX2565', from: 'Srinagar', to: 'Jammu', ac: 'A320', block: '00:50' },
      { fn: 'AIH822', from: 'Jammu', to: 'Delhi', ac: 'A320/A321', block: '01:15' },
    ],
  },
  {
    id: 'malabar',
    name: 'The Malabar Tabletop Circuit',
    tagline: "Three runways with no room for error.",
    icon: FaTriangleExclamation,
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#FECACA',
    region: 'Domestic India · Sequenced',
    stat: '4 legs · 4h30m loop',
    sequenced: true,
    description:
      "Kannur, Kozhikode and Mangalore are hemmed in by the Western Ghats and built on plateaus, not plains — tabletop runways with a drop at both ends and precisely zero margin for a long landing. Air India Express flies all three daily. This circuit strings the coastline together: Kozhikode out to Kannur, a short hop down to Mangalore, and back the way you came, entirely on the 737 family.",
    itinerary: [
      '07:00 IST — Depart Kozhikode (VOCL)',
      '07:45 — Arrive Kannur (VOKN) · 35m turn',
      '08:20 — Depart Kannur',
      '09:00 — Arrive Mangalore (VOML) · 35m turn',
      '09:35 — Depart Mangalore',
      '10:15 — Arrive back at Kannur (VOKN) · 35m turn',
      '10:50 — Depart Kannur',
      '11:30 — Arrive back at Kozhikode (VOCL)',
    ],
    legs: [
      { fn: 'IX5016H', from: 'Kozhikode', to: 'Kannur', ac: 'Boeing 737 MAX', block: '00:45' },
      { fn: 'IX890H', from: 'Kannur', to: 'Mangalore', ac: 'Boeing 737-800', block: '00:40' },
      { fn: 'IX891H', from: 'Mangalore', to: 'Kannur', ac: 'Boeing 737-800', block: '00:40' },
      { fn: 'IX369H', from: 'Kannur', to: 'Kozhikode', ac: 'Boeing 737 MAX', block: '00:40' },
    ],
  },
  {
    id: 'retro',
    name: 'The Retro Trail',
    tagline: 'Some liveries never really retire.',
    icon: FaClockRotateLeft,
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    region: 'Heritage & Nostalgia',
    stat: '2 legs sequenced + 4 highlights',
    sequenced: true,
    description:
      "AIH is INVA's living museum — a heritage callsign that keeps the Boeing 747-400 flying the long-haul rotations that built Air India's reputation, upper deck and all. Its flagship routing is a real echo of how the Jumbo used to work a network: pick up the flight in Bengaluru, work the domestic leg into Mumbai, then push on through the night to New York on the same airframe. Alongside it, 9W keeps Jet Airways' widebodies airborne on routes the airline itself never got to finish.",
    itinerary: [
      '20:00 IST — Depart Bengaluru (VOBL)',
      '21:30 — Arrive Mumbai (VABB) · 1h00 turn, same airframe',
      '22:30 — Depart Mumbai for New York',
      '14:00 (+1, local) — Arrive New York JFK, 15h30m after Mumbai',
    ],
    legs: [
      { fn: 'AIH171 (A)', from: 'Bengaluru', to: 'Mumbai', ac: 'Boeing 747-400', block: '01:30' },
      { fn: 'AIH171 (B)', from: 'Mumbai', to: 'New York JFK', ac: 'Boeing 747-400', block: '15:30' },
      { fn: 'AIH01', from: 'Delhi', to: 'Adelaide', ac: 'Boeing 747-400', block: '11:00', note: 'Suggested depart 22:00 IST — overnight Jumbo redeye' },
      { fn: 'AIH11', from: 'Delhi', to: 'Moscow', ac: 'Boeing 747-400', block: '06:00', note: 'Suggested depart 01:00 IST' },
      { fn: '9W126', from: 'Mumbai', to: 'Amsterdam', ac: 'A330-300', block: '08:55', note: 'Suggested depart 02:30 IST' },
      { fn: '9W222', from: 'Brussels', to: 'Toronto', ac: 'A330-300/777-300ER', block: '07:45', note: 'Suggested depart 11:00 local' },
    ],
  },
  {
    id: 'golden-sands',
    name: 'The Golden Sands & Haj Bridge',
    tagline: 'The corridor that carries the most people, and the most meaning.',
    icon: FaSun,
    color: '#C2410C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    region: 'Middle East & the Gulf',
    stat: '5 hand-picked legs',
    sequenced: false,
    description:
      "No corridor on the map carries more real-world weight. Delhi and Mumbai run the daily commuter shuttle to Dubai; Kochi's Air India Express service exists because of how many Keralites work in the Gulf. And every Haj and Umrah season, Jeddah becomes the busiest single destination on the network — Air India, Air India Express and the heritage 747 all running charter-density schedules from cities across the south. This trail is that corridor, in five legs.",
    legs: [
      { fn: 'AI4309', from: 'Delhi', to: 'Dubai', ac: 'Boeing 787-8', block: '03:10', note: 'Suggested depart 20:00 IST — evening commuter bank' },
      { fn: 'IX435', from: 'Kochi', to: 'Dubai', ac: 'Boeing 737-800', block: '04:00', note: 'Suggested depart 03:00 IST — the Gulf-diaspora red-eye' },
      { fn: 'AI2255', from: 'Delhi', to: 'Jeddah', ac: 'A320', block: '05:50', note: 'Suggested depart 04:00 IST — Umrah timing' },
      { fn: 'AIH959', from: 'Kozhikode', to: 'Jeddah', ac: 'Boeing 747-400', block: '05:50', note: 'Suggested depart 23:00 IST — Haj-season heritage charter' },
      { fn: 'AI2233', from: 'Mumbai', to: 'Muscat', ac: 'A320', block: '02:10', note: 'Suggested depart 05:30 IST' },
    ],
  },
  {
    id: 'southern-cross',
    name: 'The Southern Cross Trail',
    tagline: 'Down under, the long way.',
    icon: FaEarthOceania,
    color: '#0F766E',
    bg: '#F0FDFA',
    border: '#99F6E4',
    region: 'Australia & the Pacific',
    stat: '4 hand-picked legs',
    sequenced: false,
    description:
      "Eleven-plus hours before the coast even comes into view. Air India's 787s cover Sydney and Melbourne on the modern roster; the heritage 747-400, flying as AIH, still holds down Adelaide the way the Jumbo always did; and the single longest sector on this trail runs all the way to Auckland. Full-tank planning, real fatigue management, no shortcuts.",
    legs: [
      { fn: 'AI301', from: 'Sydney', to: 'Delhi', ac: 'Boeing 787-8', block: '11:45', note: 'Suggested depart 23:30 local — the redeye home' },
      { fn: 'AI310', from: 'Mumbai', to: 'Melbourne', ac: 'Boeing 787-8', block: '11:00', note: 'Suggested depart 23:45 IST' },
      { fn: 'AIH1306', from: 'Delhi', to: 'Auckland', ac: 'Boeing 787-8', block: '16:30', note: 'Suggested depart 21:00 IST — longest leg on this trail' },
      { fn: 'AIH01', from: 'Delhi', to: 'Adelaide', ac: 'Boeing 747-400', block: '11:00', note: 'Suggested depart 22:30 IST — the Jumbo still flies it' },
    ],
  },
  {
    id: 'european-relay',
    name: 'The European Relay',
    tagline: 'Two gateways, one destination: the United States.',
    icon: FaLandmark,
    color: '#6D28D9',
    bg: '#F9F5FF',
    border: '#DDD6FE',
    region: 'Europe · Sequenced',
    stat: '2 chained routings, 4 legs total',
    sequenced: true,
    description:
      "Not every Air India widebody has the range for Delhi–New York nonstop, so the network keeps two European tech-stops alive for the aircraft that need them — a real reflection of how mixed-range long-haul fleets actually get scheduled. Pick your gateway: Rome for JFK, or Vienna for the American Midwest. Same concept, different continent on the other end.",
    itinerary: [
      'ROME BRIDGE — Depart Delhi 01:30 IST · AI101 (A) · block 9h20m',
      '≈1h30 layover at Rome Fiumicino (LIRF), same airframe',
      'Depart Rome · AI101 (B) · block 8h25m · arrive New York JFK',
      '',
      'VIENNA BRIDGE — Depart Delhi 09:15 IST · AI103 (A) · block 9h39m',
      '≈1h30 layover at Vienna (LOWW), same airframe',
      'Depart Vienna · AI103 (B) · block 8h30m · arrive Washington Dulles',
    ],
    legs: [
      { fn: 'AI101 (A)', from: 'Delhi', to: 'Rome', ac: 'A350-900', block: '09:20' },
      { fn: 'AI101 (B)', from: 'Rome', to: 'New York JFK', ac: 'A350-900', block: '08:25' },
      { fn: 'AI103 (A)', from: 'Delhi', to: 'Vienna', ac: 'Boeing 787-8', block: '09:39' },
      { fn: 'AI103 (B)', from: 'Vienna', to: 'Washington Dulles', ac: 'Boeing 787-8', block: '08:30' },
      { fn: 'AI127 (A)', from: 'Delhi', to: 'Vienna', ac: 'Boeing 777-300ER', block: '09:05', note: 'Alternate Vienna routing' },
      { fn: 'AI127 (B)', from: 'Vienna', to: 'Chicago', ac: 'Boeing 777-300ER', block: '09:15', note: 'Alternate: lands O\'Hare instead of Dulles' },
    ],
  },
  {
    id: 'kolkata-relay',
    name: 'The Kolkata Relay',
    tagline: "The longest duty in the network, there and back.",
    icon: FaPlaneUp,
    color: '#1E3A8A',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    region: 'North America · Sequenced',
    stat: '4 legs · 35h40m round trip',
    sequenced: true,
    description:
      "AI183 doesn't originate in San Francisco-bound form — it starts as a Delhi–Kolkata domestic hop, and the same 777-300ER that lands in Kolkata keeps going, westbound, for another fifteen hours. It's the single longest continuous rotation on the INVA network, and it has a genuine round trip: the return working number, AI4174, retraces the exact same relay in reverse. Fly the whole thing and you've logged nearly a day and a half of block time on one aircraft type.",
    itinerary: [
      'OUTBOUND — Depart Delhi 10:00 IST · AI183 (A) · block 1h40m',
      'Arrive Kolkata ≈11:40 IST · 1h00 turn, same airframe continues',
      'Depart Kolkata 12:40 IST · AI183 (B) · block 15h10m',
      'Arrive San Francisco ≈14:20 local (same calendar day, date-line gain)',
      '',
      'RETURN — Depart San Francisco 22:00 local · AI4174 (A) · block 16h35m',
      'Arrive Kolkata ≈04:05 IST · 1h00 turn, same airframe continues',
      'Depart Kolkata 05:05 IST · AI4174 (B) · block 2h15m',
      'Arrive Delhi 07:20 IST',
    ],
    legs: [
      { fn: 'AI183 (A)', from: 'Delhi', to: 'Kolkata', ac: 'Boeing 777-300ER', block: '01:40' },
      { fn: 'AI183 (B)', from: 'Kolkata', to: 'San Francisco', ac: 'Boeing 777-300ER', block: '15:10' },
      { fn: 'AI4174 (A)', from: 'San Francisco', to: 'Kolkata', ac: 'Boeing 777-300ER', block: '16:35' },
      { fn: 'AI4174 (B)', from: 'Kolkata', to: 'Delhi', ac: 'Boeing 777-300ER', block: '02:15' },
    ],
  },
  {
    id: 'circumnavigator',
    name: 'The Circumnavigator',
    tagline: 'Home to home, the long way around.',
    icon: FaEarthAmericas,
    color: '#9D174D',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    region: 'Round-the-World · Sequenced',
    stat: '5 legs · ~51h25m · 3 A380 sectors',
    sequenced: true,
    description:
      "The most ambitious itinerary in the collection: a full circumnavigation using four airlines and three double-decker superjumbo sectors, starting and ending in Delhi. It isn't one continuous rotation — it's a challenge, best flown over several sittings — but every leg below is a real route in the network, and each hands off cleanly to the next at a shared airport.",
    itinerary: [
      'Depart Delhi 20:00 IST · AI4309 · block 3h10m · arrive Dubai',
      '2h00 layover · connect to Emirates',
      'Depart Dubai · EK215 · block 15h20m (A380) · arrive Los Angeles',
      '2h30 layover · connect to Qantas',
      'Depart Los Angeles ~21:00 local · QF12 · block 15h10m (A380) · arrive Sydney',
      '2h00 layover · connect to Qatar Airways',
      'Depart Sydney · QR909 · block 14h45m (A380) · arrive Doha',
      '2h00 layover · connect back to Air India',
      'Depart Doha · AI2284 · block 3h00m · arrive home in Delhi',
    ],
    legs: [
      { fn: 'AI4309', from: 'Delhi', to: 'Dubai', ac: 'Boeing 787-8', block: '03:10' },
      { fn: 'EK215', from: 'Dubai', to: 'Los Angeles', ac: 'A380-800', block: '15:20' },
      { fn: 'QF12', from: 'Los Angeles', to: 'Sydney', ac: 'A380-800', block: '15:10' },
      { fn: 'QR909', from: 'Sydney', to: 'Doha', ac: 'A380-800', block: '14:45' },
      { fn: 'AI2284', from: 'Doha', to: 'Delhi', ac: 'A320', block: '03:00' },
    ],
  },
  {
    id: 'silk-route',
    name: 'The Silk Route Trail',
    tagline: "India's oldest trading partners, its newest metal.",
    icon: FaRoute,
    color: '#15803D',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    region: 'East & Southeast Asia',
    stat: '5 hand-picked legs',
    sequenced: false,
    description:
      "East of India is where the partner network gets genuinely exotic — a Korean Air 747-8 into JFK, EVA and Singapore Airlines A380s on their regional trunk routes, Vietnam's newest widebodies working the Hanoi corridor, and the last echo of Vistara's purple tail still climbing out toward Tokyo. Different airline, different livery, every single leg.",
    legs: [
      { fn: 'KE81', from: 'New York JFK', to: 'Seoul Incheon', ac: 'Boeing 747-8 / A380', block: '14:35', note: 'One of two 747-8s left flying passengers anywhere on the network' },
      { fn: 'SQ637', from: 'Tokyo Narita', to: 'Singapore', ac: 'A380 / 787-10 / 777-300ER', block: '07:00', note: 'Suggested depart 09:00 local' },
      { fn: 'VN980', from: 'Delhi', to: 'Hanoi', ac: 'A350-900 / 787-9', block: '03:45', note: 'Suggested depart 14:00 IST' },
      { fn: 'UK83H', from: 'Delhi', to: 'Tokyo Haneda', ac: 'Boeing 787-9', block: '07:45', note: 'The last Vistara-liveried route still on the board' },
      { fn: 'TG910', from: 'Bangkok', to: 'London Heathrow', ac: 'A380 / 777-300ER', block: '12:30', note: 'Suggested depart 23:30 local' },
    ],
  },
  {
    id: 'baobab',
    name: 'The Baobab Trail',
    tagline: "India's oldest bridge to Africa, rebuilt.",
    icon: FaTree,
    color: '#4D7C0F',
    bg: '#F7FEE7',
    border: '#D9F99D',
    region: 'Africa & the Indian Ocean',
    stat: '5 hand-picked legs',
    sequenced: false,
    description:
      "Long before Gulf hubs dominated the map, dhow trade and colonial-era aviation tied India's west coast to East Africa. This trail rebuilds that link — Ethiopian's Addis Ababa hub reaching both Mumbai and, remarkably, Sao Paulo on the same 777; Kenya Airways bridging Nairobi to Johannesburg; Jet Airways' revived widebody doing the same Mumbai–Johannesburg run; and Air Mauritius, the quiet thread connecting Delhi to Port Louis and one of the oldest Indian diaspora communities anywhere.",
    legs: [
      { fn: 'ET610', from: 'Addis Ababa', to: 'Mumbai', ac: 'Boeing 777-200LR/787-8', block: '05:30', note: 'Suggested depart 23:00 local' },
      { fn: 'ET506', from: 'Addis Ababa', to: 'Sao Paulo', ac: 'Boeing 777-200LR', block: '12:20', note: 'An Africa–South America bridge, rare on any network' },
      { fn: 'KQ761', from: 'Nairobi', to: 'Johannesburg', ac: 'Boeing 787-8', block: '04:00', note: 'Suggested depart 08:00 local' },
      { fn: '9W116', from: 'Mumbai', to: 'Johannesburg', ac: 'A330-300', block: '09:00', note: 'Suggested depart 01:00 IST' },
      { fn: 'MK744', from: 'Port Louis', to: 'Delhi', ac: 'A330-900', block: '07:35', note: 'Air Mauritius, tracing the Indian Ocean diaspora route' },
    ],
  },
  {
    id: 'far-frontier',
    name: 'The Far Frontier Trail',
    tagline: 'For pilots chasing the routes no one else flies.',
    icon: FaCompass,
    color: '#BE185D',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    region: 'Latin America',
    stat: '4 hand-picked legs',
    sequenced: false,
    description:
      "No Indian carrier serves Latin America directly — which is exactly what makes this trail worth flying. Avianca's odd Bogota–London routing, GOL's Brazil-family metal linking Sao Paulo to Mexico City, a genuine colonial-era echo on the Lisbon–Rio run, and Copa threading Panama's hub down to Buenos Aires. A collector's trail for pilots who've already logged the rest of the map.",
    legs: [
      { fn: 'AV120', from: 'Bogota', to: 'London Heathrow', ac: 'Boeing 787-8', block: '10:00', note: 'Suggested depart 21:00 local' },
      { fn: 'VRG8670', from: 'Sao Paulo', to: 'Mexico City', ac: 'Boeing 777-200ER', block: '09:30', note: 'Suggested depart 23:30 local' },
      { fn: 'VRG8703', from: 'Lisbon', to: 'Rio de Janeiro', ac: 'Boeing 777-200ER', block: '09:30', note: 'The old Portugal–Brazil link, still flown daily' },
      { fn: 'CM167', from: 'Panama City', to: 'Buenos Aires', ac: 'Boeing 737 MAX', block: '07:10', note: 'Suggested depart 22:00 local' },
    ],
  },
  {
    id: 'toughest-approaches',
    name: "World's Toughest Approaches",
    tagline: 'Where the terrain briefing matters more than the METAR.',
    icon: FaTriangleExclamation,
    color: '#78350F',
    bg: '#FEFCE8',
    border: '#FEF08A',
    region: 'Terrain & Technique · International',
    stat: '5 curated challenge airports',
    sequenced: false,
    description:
      "Domestic India already has Leh and the Malabar tabletops — this trail rounds up the rest of the world's genuine terrain and crosswind tests, all real legs on the network. Innsbruck's Alpine bowl, Queenstown's real-world night-flight ban, Madeira's cliffside crosswind runway, Gibraltar's runway that crosses an active road, and the low approach over Maho Beach into St Maarten. Brief the terrain before you brief the weather.",
    legs: [
      { fn: 'U22299', from: 'Manchester', to: 'Innsbruck', ac: 'A320', block: '02:10', note: 'Fly by day — valley circling approach between the Alps' },
      { fn: 'QF124', from: 'Queenstown', to: 'Sydney', ac: 'Boeing 737-800', block: '03:10', note: 'Real Queenstown has no night flights — the terrain doesn\'t allow it' },
      { fn: 'U26402', from: 'Madeira', to: 'London Gatwick', ac: 'A320', block: '03:15', note: 'The runway is built out on stilts over the sea — mind the crosswind' },
      { fn: 'U26934', from: 'Gibraltar', to: 'Edinburgh', ac: 'A320', block: '03:00', note: 'The only runway anywhere that crosses a public road' },
      { fn: 'CM134', from: 'Panama City', to: 'St Maarten', ac: 'Boeing 737 MAX', block: '03:00', note: 'The low pass over Maho Beach on short final' },
    ],
  },
  {
    id: 'heavy-metal',
    name: 'The Heavy Metal Trail',
    tagline: 'Behind every passenger route, the metal that keeps it alive.',
    icon: FaBoxesPacking,
    color: '#334155',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    region: 'Cargo & Regional Feeder Ops · Sequenced',
    stat: '2 sequenced cargo legs + 2 feeder highlights',
    sequenced: true,
    description:
      "Not every mission carries passengers. This trail is INVA's operations sampler: a genuine two-leg freighter relay across Latin America on an MD-11F, a Saudia 777F hauling freight from Riyadh to Guangzhou, a Caribbean Dash 8 island-hopper, and a CRJ working the shortest kind of European feeder leg. Different checklists, different priorities, same professionalism required.",
    itinerary: [
      'Depart Guayaquil (SEGU) · VLO7432 (A) · block 5h30m (MD-11F)',
      'Arrive Mexico City · quick freighter turn, same airframe',
      'Depart Mexico City · VLO7432 (B) · block 3h30m (MD-11F) · arrive Los Angeles',
    ],
    legs: [
      { fn: 'VLO7432 (A)', from: 'Guayaquil', to: 'Mexico City', ac: 'MD-11F', block: '05:30' },
      { fn: 'VLO7432 (B)', from: 'Mexico City', to: 'Los Angeles', ac: 'MD-11F', block: '03:30' },
      { fn: 'SV978', from: 'Riyadh', to: 'Guangzhou', ac: 'Boeing 777F', block: '08:15', note: 'Suggested depart 02:00 local' },
      { fn: 'BW430', from: 'Port of Spain', to: 'Georgetown', ac: 'Dash 8-Q400', block: '00:31', note: 'Caribbean island-hopper' },
      { fn: 'LH390', from: 'Frankfurt', to: 'Luxembourg', ac: 'CRJ-900', block: '00:40', note: 'One of the shortest feeder legs on the network' },
    ],
  },
]

// ─── Responsive CSS ────────────────────────────────────────────────────────────

const STYLES = `
  .trails-hero { padding: 100px 24px 80px; }
  .trails-hero-heading { font-size: clamp(56px, 10vw, 120px); }
  .trails-hero-wordmark { display: block; width: clamp(280px, 40vw, 480px); max-width: 100%; height: auto; margin-bottom: 10px; }
  .trails-hero-stats { display: flex; flex-wrap: wrap; gap: 0; }
  .trails-stat-item { padding-right: 40px; margin-right: 40px; margin-bottom: 16px; }
  .trails-stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.1); }

  .trails-section { padding: 64px 0; }
  .trails-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .trails-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }

  .trail-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); position: relative; display: flex; flex-direction: column; }
  .trail-card-body { padding: 28px 28px 24px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
  .trail-routes { display: flex; flex-direction: column; gap: 8px; }
  .trail-route-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 7px 0; border-top: 1px solid #F1F5F9; flex-wrap: wrap; }
  .trail-itinerary { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-family: 'SF Mono', 'Courier New', monospace; }

  @media (max-width: 1023px) {
    .trails-hero { padding: 80px 20px 60px; }
    .trails-section { padding: 52px 0; }
    .trails-section-inner { padding: 0 20px; }
  }

  @media (max-width: 767px) {
    .trails-hero { padding: 72px 16px 52px; }
    .trails-hero-heading { font-size: clamp(44px, 14vw, 72px); }
    .trails-hero-wordmark { width: clamp(220px, 62vw, 320px); }
    .trails-hero-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .trails-stat-item { padding-right: 0; margin-right: 0; border-right: none !important; padding-bottom: 20px; }
    .trails-stat-item:nth-child(odd) { padding-right: 20px; }
    .trails-section { padding: 44px 0; }
    .trails-section-inner { padding: 0 16px; }
    .trails-grid { grid-template-columns: 1fr; gap: 18px; }
    .trail-card-body { padding: 22px 20px 20px; }
  }
`

// ─── Sub-components ────────────────────────────────────────────────────────────

function TrailCard({ trail }) {
  const Icon = trail.icon
  return (
    <div className="trail-card">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: trail.color, zIndex: 2 }} />

      <div className="trail-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: trail.bg, border: `1px solid ${trail.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: trail.color, fontSize: 18,
          }}>
            <Icon />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: trail.color }}>
              {trail.region}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{trail.stat}</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: '0 0 4px', lineHeight: 1.15 }}>
            {trail.name}
          </h3>
          <p style={{ fontSize: 13.5, fontWeight: 600, fontStyle: 'italic', color: trail.color, margin: 0 }}>
            {trail.tagline}
          </p>
        </div>

        <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.75, margin: 0 }}>
          {trail.description}
        </p>

        {trail.itinerary && (
          <>
            <div style={{ height: 1, background: '#F1F5F9', marginTop: 4 }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8' }}>
              Flight plan
            </div>
            <div className="trail-itinerary" style={{ background: trail.bg, border: `1px solid ${trail.border}`, borderRadius: 10, padding: '12px 14px' }}>
              {trail.itinerary.map((line, i) => (
                line === ''
                  ? <div key={i} style={{ height: 6 }} />
                  : <div key={i} style={{ color: '#334155' }}>{line}</div>
              ))}
            </div>
          </>
        )}

        <div style={{ height: 1, background: '#F1F5F9', marginTop: 4 }} />

        <div className="trail-routes">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8' }}>
            {trail.sequenced ? 'All legs' : 'Recommended legs'}
          </div>
          {trail.legs.map((r, i) => (
            <div className="trail-route-row" key={r.fn + i}>
              <span style={{ fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>{r.fn}</span>
              <span style={{ color: '#475569', flex: 1, minWidth: 160, textAlign: 'left', paddingLeft: 10 }}>
                {r.from} <span style={{ color: '#CBD5E1' }}>→</span> {r.to}
                <span style={{ color: '#94A3B8' }}> · {r.ac}</span>
              </span>
              <span style={{ color: '#94A3B8', flexShrink: 0, fontSize: 11 }}>{r.block}</span>
              {r.note && (
                <div style={{ width: '100%', fontSize: 11, color: trail.color, fontStyle: 'italic', paddingLeft: 0 }}>
                  {r.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrailsPage() {
  return (
    <main style={{ background: '#F8F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{STYLES}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="trails-hero" style={{ background: '#080D1A', position: 'relative', overflow: 'hidden' }}>
        {/* Maharaja backdrop. next/image serves an AVIF/WebP transform of the 2 MB
            PNG, decoded once — and unlike the old blueprint layer there's no filter()
            or mix-blend-mode here, both of which force a per-pixel recomposite of a
            full-bleed element on every scroll frame. */}
        <Image
          src="/hero-maharaja-trails.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}
        />
        {/* Dark wash so the white headline stays legible over the art. */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,13,26,0.55) 0%, rgba(8,13,26,0.78) 55%, rgba(8,13,26,0.92) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(43,75,238,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Indian Virtual · Infinite Flight
            </span>
          </div>

          <h1 className="trails-hero-heading" style={{
            fontWeight: 900, letterSpacing: '-0.05em', color: '#FFFFFF',
            lineHeight: 0.95, margin: '0 0 32px',
          }}>
            {/* Gold Vistaar wordmark stands in for the "MAHARAJA" line; served as an
                optimized WebP/AVIF transform and sized responsively to sit over TRAILS. */}
            <Image
              className="trails-hero-wordmark"
              src="/fonts/hero-vistaar.png"
              alt="Vistaar"
              width={677}
              height={369}
              priority
              sizes="(max-width: 767px) 320px, 480px"
            />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.25)' }}>TRAILS</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 640, margin: '0 0 52px' }}>
            2,294 routes across 380-plus airports is a route database. These fourteen trails are what happens when you go through it by hand. Six are chained itineraries — one leg's arrival airport is the next leg's departure, verified against the live network, with a suggested flight plan and departure times. The rest are hand-picked highlight reels: the routes that don't just fill a map, but tell you something about the network they're on.
          </p>

          <div className="trails-hero-stats" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
            {[
              { value: '14', label: 'Trails' },
              { value: '6', label: 'Chained Itineraries' },
              { value: '3', label: 'A380 Sectors' },
              { value: '51h', label: 'Longest Trail Block Time' },
            ].map((stat) => (
              <div key={stat.label} className="trails-stat-item">
                <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trails grid ──────────────────────────────────────────────────── */}
      <section className="trails-section">
        <div className="trails-section-inner">
          <div className="trails-grid">
            {TRAILS.map(trail => <TrailCard key={trail.id} trail={trail} />)}
          </div>
        </div>
      </section>

      {/* ── Attribution ───────────────────────────────────────────────────── */}
      <section style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '24px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
            Route data sourced live from the INVA network database; sequenced itineraries are verified leg-to-leg against it. Suggested departure times are curatorial, not scheduled data.
            INVA is not affiliated with Air India, Air India Express, Jet Airways, Vistara, Infinite Flight LLC, or any real-world carrier named above.
          </p>
        </div>
      </section>
    </main>
  )
}
