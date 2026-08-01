// ISO-3166 alpha-2 country code -> continent, covering every `cc` present in
// src/data/airport-coords.json. Server-only (used by src/lib/profile.js while
// building the cached network aggregate); never shipped to the client.

const GROUPS = {
  AF: 'DZ AO BJ BW BF BI CM CV CF TD KM CD CG CI DJ EG GQ ER ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD SZ TZ TG TN UG EH ZM ZW',
  AS: 'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KP KR KW KG LA LB MO MY MV MN MM NP OM PK PH QA SA SG LK SY TW TJ TH TL TR TM AE UZ VN YE IO',
  EU: 'AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU RS SK SI ES SE CH UA GB VA',
  NA: 'AI AG AW BS BB BZ BM BQ CA KY CR CU CW DM DO SV GL GD GP GT HT HN JM MQ MX MS NI PA PR BL KN LC MF PM VC SX TT TC US VG VI UM',
  SA: 'AR BO BR CL CO EC FK GF GY PY PE SR UY VE',
  OC: 'AS AU CK CC CX FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF',
  AN: 'AQ',
}

export const CC_TO_CONTINENT = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([continent, ccs]) =>
    ccs.split(' ').map((cc) => [cc, continent])
  )
)

export function continentFor(cc) {
  return CC_TO_CONTINENT[cc] || null
}
