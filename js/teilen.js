import { appState, state } from './state.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';
import { ladeRanglisteFirebase } from './firebase-basis.js';
import { formatZeit, getGesamtZeit } from './timer.js';
import { bewerteVersuch } from './spiellogik.js';
import { sageLaut } from './live-region.js';

// TEILEN ANFANG
export function teile() {
  const emojis=state.versuche.map(w=>bewerteVersuch(w,appState.TAGESWORT).map(s=>s==='correct'?'🟩':s==='present'?'🟧':'⬜').join('')).join('\n');
  const text=`Tippfuchs\n${state.gewonnen?state.versuche.length:'X'}/6 - ${getGesamtZeit()}\n\n${emojis}\nblindmove.blogspot.com`;
  if (navigator.share) navigator.share({text}).catch(()=>{});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=>sageLaut('Kopiert!'));
  else prompt('Ergebnis kopieren:',text);
}
export async function teileRangliste() {
  const liste=await ladeRanglisteFirebase(TAGES_IDX);
  const zeilen=liste.map((e,i)=>`${i+1}. ${e.name}: ${e.versuche} Versuch${e.versuche!==1?'e':''}, ${formatZeit(e.sekunden)}`).join('\n');
  const text=`Tippfuchs Rangliste - ${getDatum(0)}\n\n${zeilen}\nblindmove.blogspot.com`;
  if (navigator.share) navigator.share({text}).catch(()=>{});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=>sageLaut('Rangliste kopiert!'));
  else prompt('Rangliste kopieren:',text);
}
// TEILEN ENDE
