import { appState } from './state.js';

// DARK-MODE ANFANG
export function ladeDarkMode() {
  const g = localStorage.getItem('wj_theme');
  const sd = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setzeDark(g==='dark'||(!g&&sd), false);
}
export function setzeDark(dark, save=true) {
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  const btn = document.getElementById('btn-theme');
  btn.textContent = dark ? 'Hell' : 'Dunkel';
  btn.setAttribute('aria-pressed', String(dark));
  btn.setAttribute('aria-label', dark ? 'Hell-Modus aktivieren' : 'Dark Mode aktivieren');
  if (save) localStorage.setItem('wj_theme', dark ? 'dark' : 'light');
  // Natur Nacht erzwingt immer dark
  if (document.documentElement.dataset.design === 'natur-nacht') {
    document.documentElement.dataset.theme = 'dark';
  }
  if (typeof aktualisiereDarkmodeRadio === 'function') aktualisiereDarkmodeRadio();
}
// DARK-MODE ENDE

// DESIGN-MODUS ANFANG

// SVG-Pfad für den Fuchs (wiederverwendbar)
export function fuchsSVGInhalt(groesse) {
  return `
  <g id="fuchs-overlay-schwanz" style="animation:schwanz-wedeln 2s ease-in-out infinite;transform-origin:${groesse*0.13}px ${groesse*0.75}px;">
    <path d="M${groesse*0.03},${groesse*0.8} Q${groesse*-0.02},${groesse*0.63} Q${groesse*0.03},${groesse*0.5} Q${groesse*0.1},${groesse*0.37} Q${groesse*0.2},${groesse*0.47} Q${groesse*0.23},${groesse*0.53} Q${groesse*0.2},${groesse*0.67} Q${groesse*0.18},${groesse*0.83} Q${groesse*0.13},${groesse*0.87} Z" fill="#E8621A"/>
    <path d="M${groesse*0.06},${groesse*0.83} Q${groesse*0.05},${groesse*0.73} Q${groesse*0.07},${groesse*0.63} Q${groesse*0.12},${groesse*0.53} Q${groesse*0.14},${groesse*0.6} Q${groesse*0.15},${groesse*0.7} Q${groesse*0.13},${groesse*0.83} Z" fill="white"/>
  </g>
  <g style="animation:warten 2s ease-in-out infinite;transform-origin:${groesse*0.5}px ${groesse*0.58}px;">
    <ellipse cx="${groesse*0.5}" cy="${groesse*0.7}" rx="${groesse*0.27}" ry="${groesse*0.23}" fill="#E8621A"/>
    <ellipse cx="${groesse*0.5}" cy="${groesse*0.73}" rx="${groesse*0.15}" ry="${groesse*0.15}" fill="#F5E6D0"/>
    <ellipse cx="${groesse*0.76}" cy="${groesse*0.66}" rx="${groesse*0.08}" ry="${groesse*0.07}" fill="#E8621A" transform="rotate(20,${groesse*0.76},${groesse*0.66})"/>
    <polygon points="${groesse*0.33},${groesse*0.27} ${groesse*0.38},${groesse*0.47} ${groesse*0.47},${groesse*0.27}" fill="#E8621A"/>
    <polygon points="${groesse*0.35},${groesse*0.28} ${groesse*0.38},${groesse*0.43} ${groesse*0.45},${groesse*0.28}" fill="#F5E6D0"/>
    <polygon points="${groesse*0.67},${groesse*0.27} ${groesse*0.62},${groesse*0.47} ${groesse*0.53},${groesse*0.27}" fill="#E8621A"/>
    <polygon points="${groesse*0.65},${groesse*0.28} ${groesse*0.62},${groesse*0.43} ${groesse*0.55},${groesse*0.28}" fill="#F5E6D0"/>
    <ellipse cx="${groesse*0.5}" cy="${groesse*0.4}" rx="${groesse*0.22}" ry="${groesse*0.2}" fill="#E8621A"/>
    <ellipse cx="${groesse*0.5}" cy="${groesse*0.45}" rx="${groesse*0.15}" ry="${groesse*0.13}" fill="#F5E6D0"/>
    <ellipse cx="${groesse*0.41}" cy="${groesse*0.37}" rx="${groesse*0.06}" ry="${groesse*0.06}" fill="white"/>
    <ellipse cx="${groesse*0.59}" cy="${groesse*0.37}" rx="${groesse*0.06}" ry="${groesse*0.06}" fill="white"/>
    <circle cx="${groesse*0.41}" cy="${groesse*0.37}" r="${groesse*0.035}" fill="#2A1A0A"/>
    <circle cx="${groesse*0.59}" cy="${groesse*0.37}" r="${groesse*0.035}" fill="#2A1A0A"/>
    <circle cx="${groesse*0.415}" cy="${groesse*0.352}" r="${groesse*0.013}" fill="white"/>
    <circle cx="${groesse*0.595}" cy="${groesse*0.352}" r="${groesse*0.013}" fill="white"/>
    <ellipse cx="${groesse*0.5}" cy="${groesse*0.47}" rx="${groesse*0.042}" ry="${groesse*0.033}" fill="#2A1A0A"/>
    <path d="M${groesse*0.43},${groesse*0.53} Q${groesse*0.5},${groesse*0.57} ${groesse*0.57},${groesse*0.53}" fill="none" stroke="#2A1A0A" stroke-width="${groesse*0.02}" stroke-linecap="round"/>
  </g>`;
}

// Wanduhr SVG (Stoppuhr-Stil) — Zeiger werden per JS gesteuert
export function wandUhrSVG(cx, cy, r, rahmenFarbe, zifferFarbe, id) {
  // cx, cy, r sind Prozentzahlen (z.B. 50 für 50%)
  const p = v => `${v}%`;
  return `
  <circle cx="${p(cx)}" cy="${p(cy)}" r="${p(r)}" fill="${rahmenFarbe}" stroke="${zifferFarbe}" stroke-width="${p(r*0.06)}"/>
  <circle cx="${p(cx)}" cy="${p(cy)}" r="${p(r*0.88)}" fill="rgba(255,255,255,0.12)"/>
  <line x1="${p(cx)}" y1="${p(cy-r*0.6)}" x2="${p(cx)}" y2="${p(cy-r*0.78)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.06)}" stroke-linecap="round"/>
  <line x1="${p(cx)}" y1="${p(cy+r*0.6)}" x2="${p(cx)}" y2="${p(cy+r*0.78)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.06)}" stroke-linecap="round"/>
  <line x1="${p(cx-r*0.6)}" y1="${p(cy)}" x2="${p(cx-r*0.78)}" y2="${p(cy)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.06)}" stroke-linecap="round"/>
  <line x1="${p(cx+r*0.6)}" y1="${p(cy)}" x2="${p(cx+r*0.78)}" y2="${p(cy)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.06)}" stroke-linecap="round"/>
  <line id="uhr-min-${id}" x1="${p(cx)}" y1="${p(cy)}" x2="${p(cx)}" y2="${p(cy-r*0.45)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.07)}" stroke-linecap="round"/>
  <line id="uhr-sek-${id}" x1="${p(cx)}" y1="${p(cy)}" x2="${p(cx)}" y2="${p(cy-r*0.55)}" stroke="#E8621A" stroke-width="${p(r*0.04)}" stroke-linecap="round"/>
  <circle cx="${p(cx)}" cy="${p(cy)}" r="${p(r*0.06)}" fill="${zifferFarbe}"/>`;
}

const DESIGN_SVG_INHALTE = {

// FUCHSBAU — gemütliche Höhle: Kamin, Gemälde, Sofa, Fernseher, Bücherregal, Wanduhr
'fuchsbau': `
<rect width="100%" height="100%" fill="#3d1c06"/>
<ellipse cx="50%" cy="52%" rx="50%" ry="49%" fill="#72421c"/>
<ellipse cx="50%" cy="55%" rx="46%" ry="45%" fill="#8a5228"/>
<rect width="100%" height="9%" fill="#3d1c06"/>
<path d="M0,9% Q12%,7% 25%,10% Q38%,7% 50%,9% Q62%,6% 75%,10% Q88%,7% 100%,9%" fill="#2d1404"/>
<path d="M15%,0 Q13%,5% 17%,9%" fill="none" stroke="#2d1404" stroke-width="4" stroke-linecap="round"/>
<path d="M35%,0 Q32%,5% 36%,9%" fill="none" stroke="#2d1404" stroke-width="3" stroke-linecap="round"/>
<path d="M60%,0 Q63%,5% 58%,9%" fill="none" stroke="#2d1404" stroke-width="4" stroke-linecap="round"/>
<path d="M82%,0 Q85%,5% 80%,9%" fill="none" stroke="#2d1404" stroke-width="3" stroke-linecap="round"/>
<rect x="0" y="82%" width="100%" height="18%" fill="#4a2608"/>
<rect x="0" y="82%" width="100%" height="1.8%" fill="#6a3c18"/>
<line x1="0" y1="85%" x2="100%" y2="85%" stroke="#3a1e06" stroke-width="0.5" opacity="0.4"/>
<line x1="0" y1="88%" x2="100%" y2="88%" stroke="#3a1e06" stroke-width="0.5" opacity="0.4"/>
<line x1="25%" y1="82%" x2="22%" y2="100%" stroke="#3a1e06" stroke-width="0.8" opacity="0.35"/>
<line x1="50%" y1="82%" x2="48%" y2="100%" stroke="#3a1e06" stroke-width="0.8" opacity="0.35"/>
<line x1="75%" y1="82%" x2="73%" y2="100%" stroke="#3a1e06" stroke-width="0.8" opacity="0.35"/>
<rect x="1%" y="55%" width="16%" height="27%" fill="#8B3A2A" rx="2"/>
<rect x="3%" y="63%" width="12%" height="18%" fill="#1a0a00" rx="3"/>
<rect x="0" y="53.5%" width="18%" height="2.5%" fill="#a06038" rx="2"/>
<rect x="1%" y="57.5%" width="16%" height="1%" fill="#7a2e1e" opacity="0.4"/>
<rect x="1%" y="60%" width="16%" height="1%" fill="#7a2e1e" opacity="0.4"/>
<rect x="1%" y="62.5%" width="16%" height="1%" fill="#7a2e1e" opacity="0.4"/>
<ellipse cx="9%" cy="80%" rx="5%" ry="1.5%" fill="#ff4400" opacity="0.8"/>
<path d="M5.5%,80% Q5%,73% 7.5%,70% Q7%,74% 9%,69% Q11%,73% 10.5%,80% Z" fill="#ff6600" opacity="0.9"/>
<path d="M6.5%,80% Q6%,75% 8.5%,72% Q10%,75% 9.5%,80% Z" fill="#ffaa00" opacity="0.85"/>
<path d="M7.5%,80% Q8.5%,75.5% 9%,73.5% Q9.5%,76% 9%,80% Z" fill="#ffe000" opacity="0.9"/>
<ellipse cx="9%" cy="82%" rx="14%" ry="3%" fill="#ff6600" opacity="0.09"/>
<rect x="19%" y="14%" width="24%" height="34%" fill="#3a2008" rx="3"/>
<rect x="20%" y="15%" width="22%" height="32%" fill="#6a3820" rx="2"/>
<rect x="21%" y="16%" width="20%" height="30%" fill="#dce8f0"/>
<rect x="21%" y="16%" width="20%" height="16%" fill="#a8d8f0"/>
<polygon points="21%,32% 24%,22% 27%,32%" fill="#8098b8"/>
<polygon points="24%,32% 28%,20% 32%,32%" fill="#6888a8"/>
<polygon points="29%,32% 33%,21% 37%,32%" fill="#7898b8"/>
<polygon points="35%,32% 38%,23% 41%,32%" fill="#6888a8"/>
<polygon points="24%,22% 25%,25.5% 23%,25.5%" fill="white"/>
<polygon points="28%,20% 29.5%,24% 26.5%,24%" fill="white"/>
<polygon points="33%,21% 34.5%,25% 31.5%,25%" fill="white"/>
<polygon points="38%,23% 39.5%,26.5% 36.5%,26.5%" fill="white"/>
<rect x="21%" y="32%" width="20%" height="14%" fill="#5a9e30"/>
<ellipse cx="26%" cy="32%" rx="4%" ry="2%" fill="#4a8820"/>
<ellipse cx="37%" cy="32%" rx="5%" ry="2.5%" fill="#4a8820"/>
<rect x="26%" y="63%" width="46%" height="11%" fill="#a03828" rx="4"/>
<rect x="26%" y="72%" width="46%" height="12%" fill="#882a1e" rx="4"/>
<rect x="24%" y="65%" width="5%" height="14%" fill="#a03828" rx="3"/>
<rect x="71%" y="65%" width="5%" height="14%" fill="#a03828" rx="3"/>
<rect x="27%" y="73%" width="13.5%" height="9.5%" fill="#c04030" rx="3"/>
<rect x="41.5%" y="73%" width="13.5%" height="9.5%" fill="#b03020" rx="3"/>
<rect x="56%" y="73%" width="13.5%" height="9.5%" fill="#c04030" rx="3"/>
<rect x="27%" y="64%" width="13.5%" height="9%" fill="#b03020" rx="2"/>
<rect x="41.5%" y="64%" width="13.5%" height="9%" fill="#c04030" rx="2"/>
<rect x="56%" y="64%" width="13.5%" height="9%" fill="#b03020" rx="2"/>
<rect x="26.5%" y="82.5%" width="2%" height="3.5%" fill="#4a2408" rx="1"/>
<rect x="71%" y="82.5%" width="2%" height="3.5%" fill="#4a2408" rx="1"/>
<rect x="36%" y="83%" width="26%" height="3.5%" fill="#7a4820" rx="2"/>
<rect x="37%" y="86%" width="1.5%" height="4%" fill="#5a3010" rx="1"/>
<rect x="60%" y="86%" width="1.5%" height="4%" fill="#5a3010" rx="1"/>
<ellipse cx="44%" cy="82.5%" rx="2%" ry="0.9%" fill="#c8a060"/>
<rect x="48%" y="81%" width="5.5%" height="2%" fill="#2a5090" rx="0.5"/>
<rect x="63%" y="74%" width="12%" height="8%" fill="#111"/>
<rect x="66%" y="72%" width="6%" height="4%" fill="#111" rx="1"/>
<rect x="57%" y="17%" width="26%" height="50%" fill="#111" rx="4"/>
<rect x="58.5%" y="18.5%" width="23%" height="47%" fill="#160828" rx="2"/>
<polygon points="58.5%,18.5% 62%,18.5% 60%,65.5% 58.5%,65.5%" fill="#900020" opacity="0.7"/>
<polygon points="81.5%,18.5% 78%,18.5% 80%,65.5% 81.5%,65.5%" fill="#900020" opacity="0.7"/>
<ellipse cx="70%" cy="50%" rx="5%" ry="9%" fill="#ffff80" opacity="0.12"/>
<ellipse cx="70%" cy="42%" rx="3.5%" ry="3.2%" fill="#E8621A"/>
<polygon points="67%,39.5% 67.5%,34% 70%,39%" fill="#E8621A"/>
<polygon points="73%,39.5% 72.5%,34% 70%,39%" fill="#E8621A"/>
<polygon points="67.3%,39.5% 67.8%,35.5% 69.8%,39%" fill="#F5C0A0"/>
<polygon points="72.7%,39.5% 72.2%,35.5% 70.2%,39%" fill="#F5C0A0"/>
<ellipse cx="70%" cy="44%" rx="2.2%" ry="2%" fill="#F5E6D0"/>
<circle cx="68.5%" cy="41.5%" r="0.55%" fill="#1a0a00"/>
<circle cx="71.5%" cy="41.5%" r="0.55%" fill="#1a0a00"/>
<ellipse cx="70%" cy="43.5%" rx="0.5%" ry="0.4%" fill="#1a0a00"/>
<ellipse cx="70%" cy="52%" rx="3.5%" ry="5%" fill="#E8621A"/>
<line x1="71.5%" y1="50%" x2="74%" y2="47%" stroke="#E8621A" stroke-width="1.5" stroke-linecap="round"/>
<ellipse cx="74.5%" cy="45.8%" rx="1%" ry="1.4%" fill="#777"/>
<line x1="74.5%" y1="47.2%" x2="74.5%" y2="50%" stroke="#555" stroke-width="0.8" stroke-linecap="round"/>
<circle cx="80%" cy="19%" r="0.5%" fill="#00cc00" opacity="0.8"/>
<rect x="86%" y="28%" width="12%" height="54%" fill="#5a3010" rx="2"/>
<rect x="86%" y="42%" width="12%" height="1.5%" fill="#7a4828"/>
<rect x="86%" y="55%" width="12%" height="1.5%" fill="#7a4828"/>
<rect x="86%" y="68%" width="12%" height="1.5%" fill="#7a4828"/>
<rect x="87%" y="30%" width="2.2%" height="12%" fill="#c03020"/>
<rect x="89.5%" y="31%" width="1.8%" height="11%" fill="#2050a0"/>
<rect x="91.5%" y="30.5%" width="2%" height="11.5%" fill="#208040"/>
<rect x="93.8%" y="31%" width="1.8%" height="11%" fill="#a07818"/>
<rect x="95.8%" y="30%" width="1.8%" height="12%" fill="#7020a0"/>
<rect x="87%" y="44%" width="2%" height="11%" fill="#e04820"/>
<rect x="89.2%" y="45%" width="2.2%" height="10%" fill="#1840a0"/>
<rect x="91.6%" y="44.5%" width="1.8%" height="10.5%" fill="#508020"/>
<rect x="93.6%" y="45%" width="1.8%" height="10%" fill="#c08818"/>
<rect x="95.6%" y="44%" width="2%" height="11%" fill="#8030c0"/>
<rect x="87%" y="57%" width="2.2%" height="11%" fill="#d03028"/>
<rect x="89.4%" y="57.5%" width="1.8%" height="10.5%" fill="#0860a0"/>
<rect x="91.4%" y="57%" width="2%" height="11%" fill="#288028"/>
<rect x="93.6%" y="58%" width="2%" height="10%" fill="#b07010"/>
<rect x="95.8%" y="57%" width="1.8%" height="11%" fill="#901858"/>
${wandUhrSVG(50, 14, 6, '#4a2610', '#F5E6D0', 'fuchsbau')}
<circle cx="22%" cy="58%" r="0.5%" fill="#ffe060" opacity="0.65"/>
<circle cx="47%" cy="48%" r="0.4%" fill="#ffe060" opacity="0.55"/>
<circle cx="73%" cy="56%" r="0.45%" fill="#ffe060" opacity="0.65"/>
<circle cx="35%" cy="60%" r="0.35%" fill="#ffe060" opacity="0.5"/>
`,

// NATUR AM TAG — Wiese, Kirchturm links, Fuchs auf der Wiese, Werbeflieger
'natur-tag': `
<rect width="100%" height="56%" fill="#87CEEB"/>
<rect y="56%" width="100%" height="44%" fill="#5a9e30"/>
<circle cx="85%" cy="16%" r="6%" fill="#FFD700"/>
<line x1="85%" y1="6%" x2="85%" y2="3%" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
<line x1="85%" y1="26%" x2="85%" y2="29%" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
<line x1="75%" y1="16%" x2="72%" y2="16%" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
<line x1="95%" y1="16%" x2="98%" y2="16%" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="20%" cy="20%" rx="7%" ry="4%" fill="white" opacity="0.9"/>
<ellipse cx="24%" cy="18%" rx="5%" ry="3.5%" fill="white" opacity="0.9"/>
<ellipse cx="16%" cy="19%" rx="4%" ry="3%" fill="white" opacity="0.9"/>
<ellipse cx="48%" cy="17%" rx="6%" ry="3.5%" fill="white" opacity="0.85"/>
<ellipse cx="52%" cy="15%" rx="5%" ry="3%" fill="white" opacity="0.85"/>
<ellipse cx="44%" cy="16%" rx="4%" ry="2.5%" fill="white" opacity="0.85"/>
<ellipse cx="24%" cy="56%" rx="24%" ry="7%" fill="#6ab040"/>
<ellipse cx="76%" cy="57%" rx="26%" ry="7%" fill="#62a838"/>
<rect x="58%" y="45%" width="1.5%" height="13%" fill="#6B4226"/>
<ellipse cx="58.7%" cy="42%" rx="4%" ry="5%" fill="#228B22"/>
<ellipse cx="56.3%" cy="45%" rx="2.5%" ry="3%" fill="#2a9e2a"/>
<ellipse cx="61%" cy="45%" rx="2.5%" ry="3%" fill="#1e8018"/>
<rect x="78%" y="44%" width="1.5%" height="14%" fill="#6B4226"/>
<ellipse cx="78.7%" cy="41%" rx="5%" ry="6%" fill="#228B22"/>
<rect x="8%" y="25%" width="7%" height="33%" fill="#d4c8a0"/>
<rect x="7.5%" y="23%" width="8%" height="4%" fill="#c8b890"/>
<polygon points="8%,23% 11.5%,16% 15%,23%" fill="#b03020"/>
<rect x="10.5%" y="17%" width="2%" height="6%" fill="#d4c8a0"/>
<rect x="9%" y="30%" width="2.5%" height="3%" fill="#8090a0" rx="1"/>
<rect x="12%" y="30%" width="2.5%" height="3%" fill="#8090a0" rx="1"/>
${wandUhrSVG(11.5, 27, 3.5, '#d4c8a0', '#3a2a10', 'natur-tag')}
<circle cx="28%" cy="59%" r="1%" fill="#FF6B6B"/>
<circle cx="38%" cy="60%" r="0.9%" fill="#FF9FD0"/>
<circle cx="66%" cy="59%" r="1%" fill="#FF6B6B"/>
<circle cx="73%" cy="61%" r="0.9%" fill="#9B59B6"/>
<!-- WERBEFLIEGER (Propellerflugzeug mit Werbebanner, zieht von rechts nach links) -->
<!-- Seil zwischen Flugzeug und Banner -->
<line x1="32%" y1="7.5%" x2="37%" y2="8%" stroke="#888" stroke-width="0.8" opacity="0.7"/>
<!-- Werbebanner -->
<rect x="37%" y="5.5%" width="23%" height="6%" fill="#fffef5" stroke="#d4c070" stroke-width="0.8" rx="1"/>
<rect x="38.5%" y="7.2%" width="19%" height="1%" fill="#b0a030" opacity="0.25" rx="0.5"/>
<rect x="38.5%" y="9%" width="13%" height="1%" fill="#b0a030" opacity="0.2" rx="0.5"/>
<!-- Befestigungsösen am Banner -->
<circle cx="37%" cy="5.5%" r="0.4%" fill="#c0b050"/>
<circle cx="37%" cy="11.5%" r="0.4%" fill="#c0b050"/>
<!-- Flugzeug-Rumpf (Nase zeigt links) -->
<ellipse cx="28%" cy="7.5%" rx="4.5%" ry="1.4%" fill="#dde2ea"/>
<!-- Bugspitze -->
<ellipse cx="23.5%" cy="7.5%" rx="0.8%" ry="1%" fill="#c8cdd6"/>
<!-- Propeller -->
<ellipse cx="22.8%" cy="7.5%" rx="0.4%" ry="0.4%" fill="#777"/>
<line x1="22.8%" y1="5.5%" x2="22.8%" y2="9.5%" stroke="#444" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
<!-- Hauptflügel oben -->
<polygon points="27%,7% 30.5%,7% 32%,4.5% 26%,5.5%" fill="#c8cdd6"/>
<!-- Hauptflügel unten -->
<polygon points="27%,8% 30.5%,8% 32%,10.5% 26%,9.5%" fill="#c8cdd6"/>
<!-- Heckflosse oben -->
<polygon points="32%,7% 33.5%,7% 33%,5% 31.5%,6.5%" fill="#c8cdd6"/>
<!-- Cockpit-Fenster -->
<ellipse cx="26%" cy="7%" rx="0.8%" ry="0.55%" fill="#a8c8e8" opacity="0.8"/>
<ellipse cx="28.5%" cy="7%" rx="0.8%" ry="0.55%" fill="#a8c8e8" opacity="0.8"/>
<!-- Heckdüse / Schwanz -->
<ellipse cx="32.5%" cy="7.5%" rx="0.5%" ry="0.7%" fill="#b0b5bf"/>
`,

// NATUR NACHT — Sterne, Mond, Kirchturm mit leuchtendem Zifferblatt
'natur-nacht': `
<rect width="100%" height="100%" fill="#080c20"/>
<circle cx="7%" cy="14%" r="0.5%" fill="white" opacity="0.9"/>
<circle cx="18%" cy="10%" r="0.4%" fill="white" opacity="0.8"/>
<circle cx="26%" cy="15%" r="0.6%" fill="#fffbe0" opacity="0.95"/>
<circle cx="35%" cy="9%" r="0.35%" fill="white" opacity="0.7"/>
<circle cx="46%" cy="13%" r="0.5%" fill="white" opacity="0.85"/>
<circle cx="54%" cy="7%" r="0.4%" fill="#fffbe0" opacity="0.9"/>
<circle cx="63%" cy="14%" r="0.6%" fill="white" opacity="0.95"/>
<circle cx="72%" cy="9%" r="0.35%" fill="white" opacity="0.75"/>
<circle cx="81%" cy="13%" r="0.5%" fill="#fffbe0" opacity="0.9"/>
<circle cx="91%" cy="8%" r="0.4%" fill="white" opacity="0.85"/>
<circle cx="31%" cy="20%" r="0.25%" fill="white" opacity="0.65"/>
<circle cx="50%" cy="19%" r="0.25%" fill="white" opacity="0.6"/>
<circle cx="68%" cy="18%" r="0.25%" fill="white" opacity="0.65"/>
<line x1="59%" y1="12%" x2="63%" y2="16%" stroke="white" stroke-width="1.5" opacity="0.7" stroke-linecap="round"/>
<circle cx="78%" cy="16%" r="5.5%" fill="#FFF8DC"/>
<circle cx="80%" cy="14%" r="4.5%" fill="#080c20"/>
<rect y="80%" width="100%" height="20%" fill="#0a1a08"/>
<ellipse cx="29%" cy="80%" rx="29%" ry="6%" fill="#0d2010"/>
<ellipse cx="73%" cy="80%" rx="32%" ry="5.5%" fill="#0a1a08"/>
<rect x="5.5%" y="62%" width="1.2%" height="20%" fill="#050e04"/>
<path d="M3.5%,66% L6%,55% L8.5%,66% Z" fill="#050e04"/>
<path d="M4%,60% L6%,50% L8%,60% Z" fill="#071208"/>
<rect x="24.5%" y="65%" width="1%" height="17%" fill="#050e04"/>
<path d="M22.5%,68% L25%,57% L27.5%,68% Z" fill="#050e04"/>
<rect x="49%" y="60%" width="1.3%" height="22%" fill="#050e04"/>
<path d="M46.5%,64% L49.6%,52% L52.5%,64% Z" fill="#050e04"/>
<rect x="71.5%" y="63%" width="1%" height="19%" fill="#050e04"/>
<path d="M69.5%,67% L72%,56% L74.5%,67% Z" fill="#071208"/>
<rect x="90.5%" y="62%" width="1.2%" height="20%" fill="#050e04"/>
<path d="M88.5%,66% L91%,55% L93.5%,66% Z" fill="#050e04"/>
<rect x="15%" y="35%" width="8%" height="47%" fill="#1a1a2e"/>
<rect x="14.5%" y="33%" width="9%" height="4%" fill="#12122a"/>
<polygon points="15%,33% 19%,24% 23%,33%" fill="#2a2a4a"/>
<rect x="18.2%" y="25%" width="1.6%" height="8%" fill="#1a1a2e"/>
<rect x="16%" y="44%" width="3%" height="4%" fill="#8090a0" rx="1"/>
<rect x="20%" y="44%" width="3%" height="4%" fill="#8090a0" rx="1"/>
${wandUhrSVG(19, 40, 4, '#1a1a2e', '#fffbe0', 'natur-nacht')}
<circle cx="17%" cy="82%" r="0.4%" fill="#aaff60" opacity="0.8"/>
<circle cx="38%" cy="82%" r="0.35%" fill="#aaff60" opacity="0.7"/>
<circle cx="59%" cy="83%" r="0.4%" fill="#aaff60" opacity="0.8"/>
<circle cx="80%" cy="82%" r="0.35%" fill="#aaff60" opacity="0.7"/>
`
};

// Fuchs-Overlay SVGs pro Design
const FUCHS_OVERLAY_CONFIGS = {
  'standard': null,
  'fuchsbau': null,
  'natur-tag': null,
  'natur-nacht': null
};

// Uhr-IDs für Timer-Update
const UHR_IDS = {
  'fuchsbau': 'fuchsbau',
  'natur-tag': 'natur-tag',
  'natur-nacht': 'natur-nacht'
};

let aktivesDesign = 'standard';

export function aktualisiereUhrZeiger(sekunden) {
  const uhrId = UHR_IDS[aktivesDesign];
  if (!uhrId) return;
  const minEl = document.getElementById(`uhr-min-${uhrId}`);
  const sekEl = document.getElementById(`uhr-sek-${uhrId}`);
  if (!minEl || !sekEl) return;

  // Sekundenzeiger: 360° in 60 Sekunden
  const sekWinkel = (sekunden % 60) * 6;
  // Minutenzeiger: 360° in 60 Minuten
  const minWinkel = (Math.floor(sekunden / 60) % 60) * 6;

  // Zeiger-Koordinaten aus dem SVG-Element berechnen
  // Wir nutzen transform-origin über das rotate-Attribut
  const rotateSek = `rotate(${sekWinkel}, ${sekEl.x1.baseVal.value}, ${sekEl.y1.baseVal.value})`;
  const rotateMin = `rotate(${minWinkel}, ${minEl.x1.baseVal.value}, ${minEl.y1.baseVal.value})`;
  sekEl.setAttribute('transform', rotateSek);
  minEl.setAttribute('transform', rotateMin);
}

export function ladeDesign() {
  const gespeichert = localStorage.getItem('wj_design') || 'standard';
  setzeDesign(gespeichert, false);
}

export function setzeDesign(design, save=true) {
  aktivesDesign = design;
  document.documentElement.dataset.design = design;
  const hintergrund = document.getElementById('design-hintergrund');
  const svg = document.getElementById('design-svg');
  const fuchsOverlay = document.getElementById('fuchs-overlay');
  const fuchsContainer = document.getElementById('fuchs-container');

  const wortInput = document.getElementById('wort-input');
  const grafikTastatur = document.getElementById('grafik-tastatur');

  if (design === 'standard') {
    hintergrund.style.display = 'none';
    svg.innerHTML = '';
    fuchsOverlay.style.display = 'none';
    fuchsOverlay.innerHTML = '';
    // Standard: native Tastatur + VoiceOver nutzbar, grafische Tastatur trotzdem sichtbar
    if (wortInput) { wortInput.removeAttribute('inputmode'); wortInput.setAttribute('autocapitalize', 'none'); }
    if (grafikTastatur) grafikTastatur.style.display = 'flex';
    // Beim Standard: Fuchs bleibt im Header, wird von starteSpiel gesteuert
  } else {
    hintergrund.style.display = 'block';
    svg.innerHTML = DESIGN_SVG_INHALTE[design] || '';
    // Bei grafischen Designs: grafische Tastatur anzeigen
    // inputmode NICHT auf "none" setzen — Screen Reader (VoiceOver/TalkBack) brauchen native Tastatur
    if (wortInput) { wortInput.removeAttribute('inputmode'); wortInput.setAttribute('autocapitalize', 'none'); }
    if (grafikTastatur) grafikTastatur.style.display = 'flex';

    // Fuchs aus Header ausblenden — er erscheint jetzt im Overlay
    fuchsContainer.style.display = 'none';

    // Fuchs-Overlay positionieren
    const cfg = FUCHS_OVERLAY_CONFIGS[design];
    if (cfg) {
      const g = cfg.groesse;
      fuchsOverlay.style.display = 'block';
      fuchsOverlay.style.position = 'fixed';
      fuchsOverlay.style.bottom = cfg.bottom;
      fuchsOverlay.style.left = cfg.left || 'auto';
      fuchsOverlay.style.transform = cfg.transform || 'none';
      fuchsOverlay.style.width = g + 'px';
      fuchsOverlay.style.height = g + 'px';
      fuchsOverlay.style.zIndex = '2';
      fuchsOverlay.style.pointerEvents = 'none';
      fuchsOverlay.innerHTML = `<svg width="${g}" height="${g}" viewBox="0 0 ${g} ${g}" xmlns="http://www.w3.org/2000/svg">${fuchsSVGInhalt(g)}</svg>`;
    }
  }

  // Natur Nacht erzwingt dark mode
  if (design === 'natur-nacht') {
    document.documentElement.dataset.theme = 'dark';
    const btn = document.getElementById('btn-theme');
    if (btn) { btn.textContent = 'Hell'; btn.setAttribute('aria-pressed', 'true'); }
  }

  const radio = document.getElementById(`design-${design}`);
  if (radio) radio.checked = true;
  aktualisiereDesignKarten(design);
  if (save) localStorage.setItem('wj_design', design);
}

document.querySelectorAll('input[name="design"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.checked) setzeDesign(this.value);
  });
});
document.querySelectorAll('input[name="darkmode"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (this.checked) {
      setzeDark(this.value === 'dunkel');
      const radio = document.getElementById(this.value === 'dunkel' ? 'darkmode-dunkel' : 'darkmode-hell');
      if (radio) radio.checked = true;
    }
  });
});

function aktualisiereDesignKarten(design) {
  document.querySelectorAll('.design-karte').forEach(k => {
    k.classList.toggle('aktiv', k.dataset.design === design);
  });
}

export function aktualisiereDarkmodeRadio() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const hell = document.getElementById('darkmode-hell');
  const dunkel = document.getElementById('darkmode-dunkel');
  const labelHell = document.getElementById('label-darkmode-hell');
  const labelDunkel = document.getElementById('label-darkmode-dunkel');
  if (hell) hell.checked = !isDark;
  if (dunkel) dunkel.checked = isDark;
  if (labelHell) labelHell.classList.toggle('aktiv', !isDark);
  if (labelDunkel) labelDunkel.classList.toggle('aktiv', isDark);
}
// DESIGN-MODUS ENDE
// DARK-MODE ENDE
