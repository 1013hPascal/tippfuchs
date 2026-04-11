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
  <line id="uhr-min-${id}" x1="${p(cx)}" y1="${p(cy)}" x2="${p(cx)}" y2="${p(cy-r*0.6)}" stroke="${zifferFarbe}" stroke-width="${p(r*0.07)}" stroke-linecap="round"/>
  <line id="uhr-sek-${id}" x1="${p(cx)}" y1="${p(cy)}" x2="${p(cx)}" y2="${p(cy-r*0.72)}" stroke="#E8621A" stroke-width="${p(r*0.04)}" stroke-linecap="round"/>
  <circle cx="${p(cx)}" cy="${p(cy)}" r="${p(r*0.06)}" fill="${zifferFarbe}"/>`;
}

const DESIGN_SVG_INHALTE = {

// FUCHSBAU — gemütliche Höhle mit Kamin, Möbeln, Wanduhr
'fuchsbau': `
<rect width="100%" height="100%" fill="#b8935a"/>
<ellipse cx="50%" cy="50%" rx="48%" ry="46%" fill="#c8a070"/>
<ellipse cx="50%" cy="50%" rx="42%" ry="40%" fill="#d4b07a"/>
<rect width="100%" height="6%" fill="#7a4f2e" opacity="0.7"/>
<rect y="94%" width="100%" height="6%" fill="#6a3e20" opacity="0.9"/>
<rect x="0" y="92%" width="100%" height="8%" fill="#8B5E3C"/>
<path d="M0,92% Q8%,88% 15%,92% Q22%,96% 30%,92% Q38%,88% 46%,92% Q54%,96% 62%,92% Q70%,88% 78%,92% Q86%,96% 94%,92% Q97%,90% 100%,92%" fill="#a06840" stroke="none"/>
<path d="M80,0 Q75,4% 85,7%" fill="none" stroke="#5a3520" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
<path d="M200,0 Q195,5% 215,8%" fill="none" stroke="#5a3520" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
<path d="M350,0 Q340,4% 360,7%" fill="none" stroke="#5a3520" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
<path d="M500,0 Q510,5% 495,8%" fill="none" stroke="#5a3520" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
<path d="M650,0 Q645,4% 660,7%" fill="none" stroke="#5a3520" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
<rect x="3%" y="60%" width="10%" height="32%" fill="#7a4020" rx="3"/>
<rect x="4%" y="62%" width="8%" height="5%" fill="#c84020"/>
<ellipse cx="8%" cy="63%" rx="3%" ry="2%" fill="#ff8040" opacity="0.9"/>
<ellipse cx="8%" cy="62.5%" rx="2%" ry="1.5%" fill="#ffcc40" opacity="0.8"/>
<ellipse cx="7.5%" cy="62%" rx="1%" ry="1.5%" fill="white" opacity="0.6"/>
<ellipse cx="8.5%" cy="62%" rx="0.8%" ry="1.2%" fill="white" opacity="0.5"/>
<rect x="4%" y="67%" width="8%" height="1%" fill="#5a3010" opacity="0.5"/>
<rect x="75%" y="70%" width="18%" height="22%" fill="#8B5E3C" rx="4"/>
<rect x="76%" y="71%" width="16%" height="8%" fill="#a07040" rx="2"/>
<rect x="77%" y="71.5%" width="6%" height="7%" fill="#c8a060" rx="1"/>
<rect x="84%" y="71.5%" width="7%" height="7%" fill="#c8a060" rx="1"/>
<rect x="76%" y="80%" width="16%" height="1%" fill="#6a4020"/>
<rect x="77%" y="81%" width="3%" height="11%" fill="#7a4828" rx="1"/>
<rect x="88%" y="81%" width="3%" height="11%" fill="#7a4828" rx="1"/>
<circle cx="37%" cy="55%" r="0.5%" fill="#ffe060" opacity="0.9"/>
<circle cx="62%" cy="48%" r="0.4%" fill="#ffe060" opacity="0.8"/>
<circle cx="22%" cy="60%" r="0.4%" fill="#ffe060" opacity="0.7"/>
<circle cx="85%" cy="54%" r="0.45%" fill="#ffe060" opacity="0.85"/>
<circle cx="55%" cy="62%" r="0.35%" fill="#ffe060" opacity="0.75"/>
${wandUhrSVG(50, 28, 7, '#8B5E3C', '#F5E6D0', 'fuchsbau')}
`,

// NATUR AM TAG — Wiese, Kirchturm links, Fuchs auf der Wiese
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
  const gespeichert = localStorage.getItem('wj_design') || 'natur-tag';
  setzeDesign(gespeichert, false);
}

export function setzeDesign(design, save=true) {
  aktivesDesign = design;
  document.documentElement.dataset.design = design;
  const hintergrund = document.getElementById('design-hintergrund');
  const svg = document.getElementById('design-svg');
  const fuchsOverlay = document.getElementById('fuchs-overlay');
  const fuchsContainer = document.getElementById('fuchs-container');

  if (design === 'standard') {
    hintergrund.style.display = 'none';
    svg.innerHTML = '';
    fuchsOverlay.style.display = 'none';
    fuchsOverlay.innerHTML = '';
    // Beim Standard: Fuchs bleibt im Header, wird von starteSpiel gesteuert
  } else {
    hintergrund.style.display = 'block';
    svg.innerHTML = DESIGN_SVG_INHALTE[design] || '';

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
