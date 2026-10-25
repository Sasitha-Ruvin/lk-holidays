// Generates en-2027.html, si-2027.html and ta-2027.html: copies of the CBSL
// 2027 pages in the same shape the real site uses, for the parser tests.
// Run once:  node test/fixtures/make-fixtures.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));

const en = `15 January, Friday|Tamil Thai Pongal Day B. P. M.
22 January, Friday|Duruthu Full Moon Poya Day B. P.
04 February, Thursday|Independence Day B. P. M.
20 February, Saturday|Navam Full Moon Poya Day B. P.
06 March, Saturday|Mahasivarathri Day B. P.
10 March, Wednesday|Eid-Ul-Fitr (Ramazan Festival Day) B. P.
22 March, Monday|Medin Full Moon Poya Day B. P.
26 March, Friday|Good Friday B. P.
13 April, Tuesday|Day prior to Sinhala & Tamil New Year Day B. P. M.
14 April, Wednesday|Sinhala & Tamil New Year Day B. P. M.
20 April, Tuesday|Bak Full Moon Poya Day B. P.
01 May, Saturday|May Day (International Workers’ Day) B. P. M.
17 May, Monday|Eid-Ul-Allha (Hadji Festival Day) B. P.
19 May, Wednesday|Vesak Full Moon Poya Day B. P.
20 May, Thursday|Day following Vesak Full Moon Poya Day B. P. M.
18 June, Friday|Poson Full Moon Poya Day B. P.
18 July, Sunday|Esala Full Moon Poya Day B. P.
15 August, Sunday|Milad-Un-Nabi (Holy Prophet's Birthday) B. P. M.
16 August, Monday|Nikini Full Moon Poya Day B. P.
15 September, Wednesday|Binara Full Moon Poya Day B. P.
15 October, Friday|Vap Full Moon Poya Day B. P.
28 October, Thursday|Deepawali Festival Day B. P.
13 November, Saturday|Ill Full Moon Poya Day B. P.
13 December, Monday|Unduwap Full Moon Poya Day B. P.
25 December, Saturday|Christmas Day B. P. M.`;

// Copied from the CBSL Sinhala page, including its real mistakes:
// Mahasivarathri listed under February (should be March) and stray
// zero-width joiners (\u200d) in the Bak and Nikini rows.
const si = `ජනවාරි 15, සිකුරාදා|දෙමළ තෛපොංගල් දිනය    බැ.ර.වෙ.
ජනවාරි 22, සිකුරාදා|දුරුතු පුර පසළොස්වක පෝය දිනය   බැ.ර.
පෙබරවාරි 04, බ්‍රහස්පතින්දා|නිදහස් සමරු දිනය     බැ.ර.වෙ.
පෙබරවාරි 20, සෙනසුරාදා|නවම් පුර පසළොස්වක පෝය දිනය    බැ.ර.
පෙබරවාරි 06, සෙනසුරාදා|මහා ශිවරාත්‍රී දිනය    බැ.ර.
මාර්තු 10, බදාදා|ඊදුල්-ෆීතර් (රාමසාන් දිනය)    බැ.ර.
මාර්තු 22, සඳුදා|මැදින් පුර පසලොස්වක පෝය දිනය    බැ.ර.
මාර්තු 26, සිකුරාදා|මහ සිකුරාදා දිනය    බැ.ර.
අප්‍රේල් 13, අඟහරුවාදා|සිංහල හා දෙමළ අලුත් අවුරුදු දිනට පෙර දිනය    බැ.ර.වෙ.
අප්‍රේල් 14, බදාදා|සිංහල හා දෙමළ අලුත් අවුරුදු දිනය     බැ.ර.වෙ.
අප්‍රේල් 20, අඟහරුවාදා|බක් පුර \u200dපසළොස්වක පෝය දිනය     බැ.ර.
මැයි 01, සෙනසුරාදා|ලෝක කම්කරු දිනය     බැ.ර.වෙ.
මැයි 17, සඳුදා|ඊදුල් අල්හා (හජ්ජි උත්සව දිනය)    බැ.ර.
මැයි 19, බදාදා|වෙසක් පුර පසළොස්වක පෝය දිනය    බැ.ර.
මැයි 20, බ්‍රහස්පතින්දා|වෙසක් පුර පසළොස්වක පෝය දිනයට පසු දිනය    බැ.ර.වෙ.
ජූනි 18, සිකුරාදා|පොසොන් පුර පසළොස්වක පෝය දිනය    බැ.ර.
ජූලි 18, ඉරිදා|ඇසළ පුර පසළොස්වක පෝය දිනය    බැ.ර.
අගෝස්තු 15, ඉරිදා|මිලා-දුන් නබි (නබි නායකතුමාගේ උපන්දිනය)    බැ.ර.වෙ.
අගෝස්තු 16, සඳුදා|නිකිණි පුර \u200dපසළොස්වක පෝය දිනය     බැ.ර.
සැප්තැම්බර් 15, බදාදා|බිනර පුර පසළොස්වක පෝය දිනය    බැ.ර.
ඔක්තෝබර් 15, සිකුරාදා|වප් පුර පසළොස්වක පෝය දිනය    බැ.ර.
ඔක්තෝබර් 28, බ්‍රහස්පතින්දා|දීපවාලී උත්සව දිනය    බැ.ර.
නොවැම්බර් 13, සෙනසුරාදා|ඉල් පුර පසළොස්වක පෝය දිනය    බැ.ර.
දෙසැම්බර් 13, සඳුදා|උඳුවප් පුර පසළොස්වක පෝය දිනය     බැ.ර.
දෙසැම්බර් 25, සෙනසුරාදා|නත්තල් දිනය    බැ.ර.වෙ.`;

// Copied from the CBSL Tamil page (including "தொழிலாளா்கள்" and "தினம"
// typos that the parser/dictionary must cope with).
const ta = `சனவரி 15 வெள்ளிக்கிழமை|தமிழ் தைப்பொங்கல் தினம் வ.அ.வர்.
சனவரி 22 வெள்ளிக்கிழமை|துருத்து முழு நோன்மதி தினம் வ.அ.
பெப்புருவரி 04 வியாழக்கிழமை|சுதந்திர தினம் வ.அ.வர்.
பெப்புருவரி 20 சனிக்கிழமை|நவம் முழு நோன்மதி தினம் வ.அ.
மாச்சு 06 சனிக்கிழமை|மகா சிவராத்திரி தினம் வ.அ.
மாச்சு 10 புதன்கிழமை|ஈதுல் பித்ர் (ரமழான் பெருநாள் தினம்) வ.அ.
மாச்சு 22 திங்கட்கிழமை|மெதின் முழு நோன்மதி தினம் வ.அ.
மாச்சு 26 வெள்ளிக்கிழமை|பெரிய வெள்ளி வ.அ.
ஏப்பிறல் 13 செவ்வாய்க்கிழமை|சிங்கள, தமிழ் புத்தாண்டு தினத்திற்கு முந்திய தினம் வ.அ.வர்.
ஏப்பிறல் 14 புதன்கிழமை|சிங்கள, தமிழ் புத்தாண்டு வ.அ.வர்.
ஏப்பிறல் 20 செவ்வாய்க்கிழமை|பக் முழு நோன்மதி தினம் வ.அ.
மே 01 சனிக்கிழமை|மே தினம் (சர்வதேச தொழிலாளா்கள் தினம்) வ.அ.வர்.
மே 17 திங்கட்கிழமை|ஈதுல் அழ்ஹா (ஹஜ் பெருநாள் தினம்) வ.அ.
மே 19 புதன்கிழமை|வெசாக் முழு நோன்மதி தினம் வ.அ.
மே 20 வியாழக்கிழமை|வெசாக் முழு நோன்மதி தினத்திற்கு அடுத்த நாள் வ.அ.வர்.
யூன் 18 வெள்ளிக்கிழமை|பொசொன் முழு நோன்மதி தினம் வ.அ.
யூலை 18 ஞாயிற்றுக்கிழமை|எசல முழு நோன்மதி தினம் வ.அ.
ஓகத்து 15 ஞாயிற்றுக்கிழமை|மீலா துன் நபி (நபிகள் நாயகம் பிறந்த தினம்) வ.அ.வர்.
ஓகத்து 16 திங்கட்கிழமை|நிக்கினி முழு நோன்மதி தினம் வ.அ.
செத்தெம்பர் 15 புதன்கிழமை|பினர முழு நோன்மதி தினம் வ.அ.
ஒத்தோபர் 15 வெள்ளிக்கிழமை|வப் முழு நோன்மதி தினம் வ.அ.
ஒத்தோபர் 28 வியாழக்கிழமை|தீபாவளித் திருநாள் தினம் வ.அ.
நவெம்பர் 13 சனிக்கிழமை|இல் முழு நோன்மதி தினம் வ.அ.
திசெம்பர் 13 திங்கட்கிழமை|உந்துவப் முழு நோன்மதி தினம வ.அ.
திசெம்பர் 25 சனிக்கிழமை|நத்தார் பண்டிகைத் தினம் வ.அ.வர்.`;

const rows = (text) => text.split('\n').map((l) => l.split('|'));

// Same shape as the real Drupal page: header row, a blank row every 4 rows,
// a legend row, and a <script> containing fake <tr> markup the parser must ignore.
function tablePage(lang, title, list, legend) {
  const trs = [];
  list.forEach(([date, desc], i) => {
    trs.push(`<tr>\n<td style="width:40%"><p>${date}</p></td>\n<td><p>${desc.replace(/&/g, '&amp;')}</p></td>\n</tr>`);
    if (i % 4 === 3) trs.push('<tr><td>&nbsp;</td><td>&nbsp;</td></tr>');
  });
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${title} | Central Bank of Sri Lanka</title>
<script>var x = "<tr><td>January 1</td><td>Fake B.</td></tr>";</script></head>
<body><nav><ul><li><a href="#">About</a></li></ul></nav>
<div class="field-item even"><table border="1" cellpadding="1" cellspacing="1"><tbody>
<tr><td><strong>Date</strong></td><td><strong>Description</strong></td></tr>
${trs.join('\n')}
<tr><td colspan="2">${legend}</td></tr>
</tbody></table></div></body></html>`;
}

writeFileSync(
  join(dir, 'en-2027.html'),
  tablePage('en', 'Central Bank of Sri Lanka - Bank Holidays for 2027', rows(en),
    'B – Bank Holiday P – Public Holiday M - Mercantile Holiday<br>All Saturdays and Sundays are Bank Holidays'),
);
writeFileSync(
  join(dir, 'si-2027.html'),
  tablePage('si', 'ශ්‍රී ලංකා මහ බැංකුව - 2027 වසර සඳහා බැංකු නිවාඩු දිනයන්', rows(si),
    'බැ – බැංකු නිවාඩු ර – රජයේ නිවාඩු වෙ - වෙළෙඳ නිවාඩු'),
);

// The Tamil page is a plain list (no <table>) to exercise the fallback parser.
const lis = rows(ta).map(([d, desc]) => `<li>${d} ${desc}</li>`).join('\n');
writeFileSync(
  join(dir, 'ta-2027.html'),
  `<!DOCTYPE html><html lang="ta"><head><meta charset="utf-8"><title>இலங்கை மத்திய வங்கி - 2027 இற்கான வங்கி விடுமுறைகள்</title></head>
<body><ul><li>திகதி விபரம்</li>
${lis}
<li>வ – வங்கி விடுமுறை அ – அரச விடுமுறை வர். – வர்த்தக விடுமுறை</li></ul></body></html>`,
);

console.log('fixtures written to', dir);