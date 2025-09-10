import React from 'react';

// Federation mapping utility
// Maps 3-letter federation codes to 2-letter ISO country codes
// Also maps state codes to their respective countries

export const federationToCountry: Record<string, string> = {
  // Australia and its states/territories
  'AUS': 'au',
  'VIC': 'au', // Victoria
  'NSW': 'au', // New South Wales
  'QLD': 'au', // Queensland
  'WA': 'au',  // Western Australia
  'SA': 'au',  // South Australia
  'TAS': 'au', // Tasmania
  'NT': 'au',  // Northern Territory
  'ACT': 'au', // Australian Capital Territory
  
  // Major countries
  'USA': 'us',
  'GBR': 'gb',
  'CAN': 'ca',
  'GER': 'de',
  'FRA': 'fr',
  'ITA': 'it',
  'ESP': 'es',
  'NED': 'nl',
  'BEL': 'be',
  'SWE': 'se',
  'NOR': 'no',
  'DEN': 'dk',
  'FIN': 'fi',
  'POL': 'pl',
  'CZE': 'cz',
  'HUN': 'hu',
  'ROM': 'ro',
  'BUL': 'bg',
  'GRE': 'gr',
  'TUR': 'tr',
  'RUS': 'ru',
  'UKR': 'ua',
  'BLR': 'by',
  'LAT': 'lv',
  'EST': 'ee',
  'LTU': 'lt',
  'MDA': 'md',
  'GEO': 'ge',
  'ARM': 'am',
  'AZE': 'az',
  'KAZ': 'kz',
  'UZB': 'uz',
  'KGZ': 'kg',
  'TJK': 'tj',
  'TKM': 'tm',
  'CHN': 'cn',
  'JPN': 'jp',
  'KOR': 'kr',
  'MNG': 'mn',
  'VNM': 'vn',
  'THA': 'th',
  'MYS': 'my',
  'SGP': 'sg',
  'IDN': 'id',
  'PHL': 'ph',
  'IND': 'in',
  'PAK': 'pk',
  'BGD': 'bd',
  'BAN': 'bd', // Bangladesh (alternative code)
  'LKA': 'lk',
  'NPL': 'np',
  'BTN': 'bt',
  'MMR': 'mm',
  'LAO': 'la',
  'KHM': 'kh',
  'BRN': 'bn',
  'TLS': 'tl',
  'PNG': 'pg',
  'FJI': 'fj',
  'NZL': 'nz',
  'BRA': 'br',
  'ARG': 'ar',
  'CHL': 'cl',
  'PER': 'pe',
  'COL': 'co',
  'VEN': 've',
  'ECU': 'ec',
  'BOL': 'bo',
  'PRY': 'py',
  'URY': 'uy',
  'GUY': 'gy',
  'SUR': 'sr',
  'MEX': 'mx',
  'GTM': 'gt',
  'BLZ': 'bz',
  'HND': 'hn',
  'SLV': 'sv',
  'NIC': 'ni',
  'CRI': 'cr',
  'PAN': 'pa',
  'CUB': 'cu',
  'JAM': 'jm',
  'HTI': 'ht',
  'DOM': 'do',
  'PRI': 'pr',
  'TTO': 'tt',
  'BRB': 'bb',
  'GRD': 'gd',
  'LCA': 'lc',
  'VCT': 'vc',
  'ATG': 'ag',
  'KNA': 'kn',
  'DMA': 'dm',
  'AIA': 'ai',
  'VGB': 'vg',
  'CYM': 'ky',
  'BMU': 'bm',
  'TCA': 'tc',
  'MSR': 'ms',
  'SHN': 'sh',
  'ASC': 'ac',
  'TAA': 'ta',
  'IOT': 'io',
  'PCN': 'pn',
  'WLF': 'wf',
  'PYF': 'pf',
  'NCL': 'nc',
  'VUT': 'vu',
  'SLB': 'sb',
  'KIR': 'ki',
  'TUV': 'tv',
  'NRU': 'nr',
  'PLW': 'pw',
  'FSM': 'fm',
  'MHL': 'mh',
  'MNP': 'mp',
  'GUM': 'gu',
  'ASM': 'as',
  'COK': 'ck',
  'NIU': 'nu',
  'TKL': 'tk',
  'TON': 'to',
  'WSM': 'ws',
  'IRI': 'ir',
  'IRQ': 'iq',
  'JOR': 'jo',
  'KWT': 'kw',
  'LBN': 'lb',
  'OMN': 'om',
  'QAT': 'qa',
};

/**
 * Converts a federation code to a 2-letter ISO country code
 * @param federation - The 3-letter federation code or state code
 * @returns The 2-letter ISO country code, or the original code if not found
 */
export function getCountryCode(federation: string): string {
  if (!federation) return '';
  
  // Handle edge case where federation comes as "FLAG/VIC.PNG" format
  let cleanFederation = federation;
  if (federation.includes('/')) {
    // Extract the federation code from path like "FLAG/VIC.PNG"
    const parts = federation.split('/');
    if (parts.length > 1) {
      const fileName = parts[parts.length - 1]; // Get the last part (VIC.PNG)
      cleanFederation = fileName.split('.')[0]; // Remove extension (VIC)
    }
  }
  
  const upperFederation = cleanFederation.toUpperCase();
  return federationToCountry[upperFederation] || upperFederation;
}

/**
 * Gets the flag image URL for a federation code
 * @param federation - The 3-letter federation code or state code
 * @returns The flag image URL or null if not found
 */
export function getFlagUrl(federation: string): string | null {
  // Handle edge case where federation comes as "FLAG/VIC.PNG" format
  let cleanFederation = federation;
  if (federation.includes('/')) {
    // Extract the federation code from path like "FLAG/VIC.PNG"
    const parts = federation.split('/');
    if (parts.length > 1) {
      const fileName = parts[parts.length - 1]; // Get the last part (VIC.PNG)
      cleanFederation = fileName.split('.')[0]; // Remove extension (VIC)
    }
  }
  
  const countryCode = getCountryCode(cleanFederation);
  if (!countryCode || countryCode === cleanFederation.toUpperCase()) {
    return null; // No mapping found, return null to show text instead
  }
  
  return `https://raw.githubusercontent.com/lipis/flag-icons/refs/heads/main/flags/1x1/${countryCode}.svg`;
}

/**
 * Renders a federation code as either a flag image or text
 * @param federation - The 3-letter federation code or state code
 * @returns React element with flag image or text
 */
export function renderFederation(federation: string): React.ReactElement {
  const flagUrl = getFlagUrl(federation);
  
  if (flagUrl) {
    return React.createElement('img', {
      src: flagUrl,
      alt: federation,
      className: "w-4 h-4 inline-block mr-1",
      title: federation
    });
  }
  
  return React.createElement('span', {}, federation);
}
