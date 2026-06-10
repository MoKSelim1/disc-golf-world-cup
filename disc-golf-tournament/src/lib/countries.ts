const COUNTRY_ALIASES: Record<string, string> = {
  america: 'US',
  usa: 'US',
  us: 'US',
  'u s a': 'US',
  'united states': 'US',
  'united states of america': 'US',
  canada: 'CA',
  mexico: 'MX',
  brazil: 'BR',
  argentina: 'AR',
  colombia: 'CO',
  chile: 'CL',
  peru: 'PE',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'united kingdom': 'GB',
  uk: 'GB',
  ireland: 'IE',
  france: 'FR',
  germany: 'DE',
  spain: 'ES',
  portugal: 'PT',
  italy: 'IT',
  netherlands: 'NL',
  belgium: 'BE',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  estonia: 'EE',
  latvia: 'LV',
  lithuania: 'LT',
  poland: 'PL',
  czechia: 'CZ',
  'czech republic': 'CZ',
  austria: 'AT',
  switzerland: 'CH',
  greece: 'GR',
  turkey: 'TR',
  ukraine: 'UA',
  japan: 'JP',
  china: 'CN',
  india: 'IN',
  korea: 'KR',
  'south korea': 'KR',
  australia: 'AU',
  'new zealand': 'NZ',
  egypt: 'EG',
  morocco: 'MA',
  nigeria: 'NG',
  ghana: 'GH',
  kenya: 'KE',
  'south africa': 'ZA',
};

function normalizeCountry(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function codeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

export function countryFlag(country: string): string | null {
  const normalized = normalizeCountry(country);
  if (!normalized || normalized === 'tbd') return null;

  const compact = normalized.replace(/\s/g, '');
  const code = /^[a-z]{2}$/.test(compact) ? compact : COUNTRY_ALIASES[normalized];
  return code ? codeToFlag(code) : null;
}
