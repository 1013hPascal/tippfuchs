import { appState } from './state.js';
import { db, ref, get, set, child } from './firebase-config.js';
import { LOESUNGSWOERTER } from './loesungswoerter.js';
import { getTagesIndex } from './hilfsfunktionen.js';

export const TAGES_IDX = getTagesIndex();
export const HEUTE_KEY = `wj_${TAGES_IDX}`;

export async function ladeTageswort() {
  try {
    const snap = await get(child(ref(db), `tageswoerter/${TAGES_IDX}`));
    if (snap.exists()) { appState.TAGESWORT = snap.val(); return; }
    const verwendetSnap = await get(child(ref(db), 'verwendeteWoerter'));
    let verwendet = verwendetSnap.exists() ? Object.values(verwendetSnap.val()) : [];
    let verfuegbar = LOESUNGSWOERTER.filter(w => !verwendet.includes(w));
    if (verfuegbar.length === 0) {
      await set(ref(db, 'verwendeteWoerter'), null);
      verfuegbar = [...LOESUNGSWOERTER];
    }
    const zufallsIndex = Math.floor(Math.random() * verfuegbar.length);
    appState.TAGESWORT = verfuegbar[zufallsIndex];
    await set(ref(db, `tageswoerter/${TAGES_IDX}`), appState.TAGESWORT);
    await set(ref(db, `verwendeteWoerter/${TAGES_IDX}`), appState.TAGESWORT);
  } catch(e) {
    appState.TAGESWORT = LOESUNGSWOERTER[TAGES_IDX % LOESUNGSWOERTER.length];
  }
}
// TAGESWORT-LOGIK ENDE
