import { localeCountryMap } from "../helpers/localeCountryMap.js";
import { getConfiguration } from "../config/config.js";

export function mapCountry(AccHeader: string, country: string, countryCode: string): number { 
const {penalties} = getConfiguration()
let score = 0;

const accept = AccHeader;
const langs = accept
  .split(',')
  .map(entry => {
    const [tag, q] = entry.trim().split(';q=');
    return { tag: tag.toLowerCase(), weight: q ? parseFloat(q) : 1 };
  })
  .sort((a, b) => b.weight - a.weight); // highest q first


const geoFull   = country.toLowerCase();
const geoCode  = countryCode.toLowerCase();


let localeMatchesGeo = false;
for (const { tag } of langs) {

  const [lang, region] = tag.split(/[-_]/);


  if (region && region === geoCode) {
    localeMatchesGeo = true;
    break;
  }


  const mapped = localeCountryMap[tag] ?? localeCountryMap[lang];
  if (mapped && mapped.toLowerCase() === geoFull) {
    localeMatchesGeo = true;
    break;
  }
}


if (!localeMatchesGeo && geoFull !== 'unknown') {
  return score += penalties.localeMismatch;
}
    return 0;
}