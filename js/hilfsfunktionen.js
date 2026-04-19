// HILFSFUNKTIONEN ANFANG
export const ALLE_BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function getDatumVonIdx(idx) {
  const start = new Date(2025, 0, 1);
  const d = new Date(start.getTime() + idx * 86400000);
  return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
}
export function getDatum(offsetTage) {
  const d = new Date();
  d.setDate(d.getDate() + offsetTage);
  return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
}
export function getTagesIndex() {
  const jetzt = new Date();
  const jahr = jetzt.getFullYear();
  const monat = jetzt.getMonth();
  const tag = jetzt.getDate();
  const heuteMitternacht = Date.UTC(jahr, monat, tag);
  const startMitternacht = Date.UTC(2025, 0, 1);
  return Math.floor((heuteMitternacht - startMitternacht) / 86400000);
}
export function getMonatName(monat) {
  const tiere = ['Ratte','Rind','Tiger','Hase','Drache','Schlange','Pferd','Schaf','Affe','Hahn','Hund','Schwein'];
  const namen = ['Januar','Februar','Maerz','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return tiere[monat]+' '+namen[monat];
}
export function getJahrGott(jahr) {
  const pflanzen = {
    2025: jahr+' 🌱',
    2026: jahr+' 🌿',
    2027: jahr+' 🍀',
    2028: jahr+' 🌾',
    2029: jahr+' 🌵',
    2030: jahr+' 🌲'
  };
  return (pflanzen[jahr]||jahr+' 🌳');
}
export function wortbedeutungLinksHTML(wort) {
  if (!wort || wort === '-') return '';
  const w = wort.toLowerCase();
  const wKap = w.charAt(0).toUpperCase() + w.slice(1);
  const dwds = `https://www.dwds.de/wb/${w}`;
  const wikt = `https://de.wiktionary.org/wiki/${wKap}`;
  return `<a href="${dwds}" target="_blank" rel="noopener noreferrer" class="erklaer-link">Auf DWDS nachschlagen</a>`
       + `<a href="${wikt}" target="_blank" rel="noopener noreferrer" class="erklaer-link">Auf Wiktionary nachschlagen</a>`;
}
// HILFSFUNKTIONEN ENDE
