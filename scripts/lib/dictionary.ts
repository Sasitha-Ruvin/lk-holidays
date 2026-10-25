/**
 * Official holiday names in English, Sinhala and Tamil, keyed by a stable id.
 *
 * Built from CBSL's own Sinhala (/si/) and Tamil (/ta/) holiday pages, with
 * small typo fixes so the same holiday has the same name every year.
 * When CBSL publishes a holiday that is NOT in this list (e.g. a one-off
 * special holiday), the scraper uses the Sinhala/Tamil text from the CBSL
 * page itself instead.
 */

export interface DictEntry {
  key: string;
  en: string;
  si: string;
  ta: string;
  isPoya: boolean;
}

interface PoyaMonth {
  key: string;
  en: string;
  si: string;
  ta: string;
  /** lower-case spellings CBSL has used over the years */
  aliases: string[];
}

const POYA_MONTHS: PoyaMonth[] = [
  { key: 'duruthu', en: 'Duruthu', si: 'දුරුතු', ta: 'துருத்து', aliases: ['duruthu', 'durutu'] },
  { key: 'navam', en: 'Navam', si: 'නවම්', ta: 'நவம்', aliases: ['navam'] },
  { key: 'medin', en: 'Medin', si: 'මැදින්', ta: 'மெதின்', aliases: ['medin', 'madin'] },
  { key: 'bak', en: 'Bak', si: 'බක්', ta: 'பக்', aliases: ['bak'] },
  { key: 'vesak', en: 'Vesak', si: 'වෙසක්', ta: 'வெசாக்', aliases: ['vesak', 'wesak'] },
  { key: 'poson', en: 'Poson', si: 'පොසොන්', ta: 'பொசொன்', aliases: ['poson'] },
  { key: 'esala', en: 'Esala', si: 'ඇසළ', ta: 'எசல', aliases: ['esala', 'esela', 'asala'] },
  { key: 'nikini', en: 'Nikini', si: 'නිකිණි', ta: 'நிக்கினி', aliases: ['nikini'] },
  { key: 'binara', en: 'Binara', si: 'බිනර', ta: 'பினர', aliases: ['binara'] },
  { key: 'vap', en: 'Vap', si: 'වප්', ta: 'வப்', aliases: ['vap', 'wap'] },
  { key: 'ill', en: 'Ill', si: 'ඉල්', ta: 'இல்', aliases: ['ill', 'il'] },
  { key: 'unduvap', en: 'Unduvap', si: 'උඳුවප්', ta: 'உந்துவப்', aliases: ['unduvap', 'unduwap'] },
];

const FIXED: Array<DictEntry & { match: RegExp }> = [
  {
    key: 'thai-pongal',
    match: /thai\s*pongal/,
    en: 'Tamil Thai Pongal Day',
    si: 'දෙමළ තෛපොංගල් දිනය',
    ta: 'தமிழ் தைப்பொங்கல் தினம்',
    isPoya: false,
  },
  {
    key: 'independence-day',
    match: /independence|national\s+day/,
    en: 'Independence Day',
    si: 'නිදහස් සමරු දිනය',
    ta: 'சுதந்திர தினம்',
    isPoya: false,
  },
  {
    key: 'mahasivarathri',
    match: /maha\s*-?\s*s[hi]?iva/,
    en: 'Mahasivarathri Day',
    si: 'මහා ශිවරාත්‍රී දිනය',
    ta: 'மகா சிவராத்திரி தினம்',
    isPoya: false,
  },
  {
    key: 'eid-ul-fitr',
    match: /fitr?e?\b|ramazan|ramadan/,
    en: 'Id-Ul-Fitr (Ramazan Festival Day)',
    si: 'ඊදුල්-ෆීතර් (රාමසාන් දිනය)',
    ta: 'ஈதுல் பித்ர் (ரமழான் பெருநாள் தினம்)',
    isPoya: false,
  },
  {
    key: 'good-friday',
    match: /good\s+friday/,
    en: 'Good Friday',
    si: 'මහ සිකුරාදා දිනය',
    ta: 'பெரிய வெள்ளி',
    isPoya: false,
  },
  // must come before 'new-year'
  {
    key: 'new-year-eve',
    match: /(prior|before)\s+(to\s+)?(the\s+)?sinhala/,
    en: 'Day prior to Sinhala & Tamil New Year Day',
    si: 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනට පෙර දිනය',
    ta: 'சிங்கள, தமிழ் புத்தாண்டு தினத்திற்கு முந்திய தினம்',
    isPoya: false,
  },
  {
    key: 'new-year',
    match: /sinhala.*tamil\s+new\s+year/,
    en: 'Sinhala & Tamil New Year Day',
    si: 'සිංහල හා දෙමළ අලුත් අවුරුදු දිනය',
    ta: 'சிங்கள, தமிழ் புத்தாண்டு',
    isPoya: false,
  },
  {
    key: 'may-day',
    match: /may\s+day|workers|labou?r\s+day/,
    en: 'May Day (International Workers’ Day)',
    si: 'ලෝක කම්කරු දිනය',
    ta: 'மே தினம் (சர்வதேச தொழிலாளர்கள் தினம்)',
    isPoya: false,
  },
  {
    key: 'eid-ul-adha',
    match: /hadji|hajj|haji|adha|al+ha\b/,
    en: 'Id-Ul-Alha (Hadji Festival Day)',
    si: 'ඊදුල් අල්හා (හජ්ජි උත්සව දිනය)',
    ta: 'ஈதுல் அழ்ஹா (ஹஜ் பெருநாள் தினம்)',
    isPoya: false,
  },
  // must come before 'vesak-poya'
  {
    key: 'day-after-vesak',
    match: /(following|after)\s+(the\s+)?(vesak|wesak)/,
    en: 'Day following Vesak Full Moon Poya Day',
    si: 'වෙසක් පුර පසළොස්වක පෝය දිනයට පසු දිනය',
    ta: 'வெசாக் முழு நோன்மதி தினத்திற்கு அடுத்த நாள்',
    isPoya: false,
  },
  {
    key: 'milad-un-nabi',
    match: /milad|prophet/,
    en: "Milad-Un-Nabi (Holy Prophet's Birthday)",
    si: 'මිලා-දුන් නබි (නබි නායකතුමාගේ උපන්දිනය)',
    ta: 'மீலா துன் நபி (நபிகள் நாயகம் பிறந்த தினம்)',
    isPoya: false,
  },
  {
    key: 'deepavali',
    match: /deepa?v?w?ali|diwali/,
    en: 'Deepavali Festival Day',
    si: 'දීපවාලී උත්සව දිනය',
    ta: 'தீபாவளித் திருநாள் தினம்',
    isPoya: false,
  },
  {
    key: 'christmas',
    match: /christmas/,
    en: 'Christmas Day',
    si: 'නත්තල් දිනය',
    ta: 'நத்தார் பண்டிகைத் தினம்',
    isPoya: false,
  },
  {
    key: 'special-bank-holiday',
    match: /special\s+bank\s+holiday/,
    en: 'Special Bank Holiday',
    si: 'විශේෂ බැංකු නිවාඩු දිනය',
    ta: 'விசேட வங்கி விடுமுறை தினம்',
    isPoya: false,
  },
];

const POYA_RE = /\b(adhi\s+)?([a-z]+)\s+full\s+moon\s+poya/;

/** Find the dictionary entry for an English CBSL holiday name. */
export function lookup(englishName: string): DictEntry | undefined {
  const s = englishName.toLowerCase().replace(/\s+/g, ' ').trim();

  // Fixed holidays that mention a poya (e.g. "Day following Vesak ...")
  // are matched first.
  const dayAfterVesak = FIXED.find((f) => f.key === 'day-after-vesak')!;
  if (dayAfterVesak.match.test(s)) return strip(dayAfterVesak);

  const poya = POYA_RE.exec(s);
  if (poya) {
    const adhi = Boolean(poya[1]);
    const month = POYA_MONTHS.find((m) => m.aliases.includes(poya[2]));
    if (month) {
      return {
        key: `${adhi ? 'adhi-' : ''}${month.key}-poya`,
        en: `${adhi ? 'Adhi ' : ''}${month.en} Full Moon Poya Day`,
        si: `${adhi ? 'අධි ' : ''}${month.si} පුර පසළොස්වක පෝය දිනය`,
        ta: `${adhi ? 'அதி ' : ''}${month.ta} முழு நோன்மதி தினம்`,
        isPoya: true,
      };
    }
  }

  // Islamic festivals: test the specific ones before the loose regexes.
  if (/milad|prophet/.test(s)) return strip(FIXED.find((f) => f.key === 'milad-un-nabi')!);
  if (/fitr?e?\b|ramazan|ramadan/.test(s)) return strip(FIXED.find((f) => f.key === 'eid-ul-fitr')!);
  if (/hadji|hajj|haji|adha|al+ha\b/.test(s)) return strip(FIXED.find((f) => f.key === 'eid-ul-adha')!);

  for (const f of FIXED) {
    if (f.key === 'eid-ul-fitr' || f.key === 'eid-ul-adha') continue;
    if (f.match.test(s)) return strip(f);
  }
  return undefined;
}

function strip(f: DictEntry & { match?: RegExp }): DictEntry {
  return { key: f.key, en: f.en, si: f.si, ta: f.ta, isPoya: f.isPoya };
}

/** Make a URL-safe key from an English name, for holidays not in the dictionary. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}