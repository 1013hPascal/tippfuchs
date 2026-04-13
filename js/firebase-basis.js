import { appState, state } from './state.js';
import { db, ref, get, set, child } from './firebase-config.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';

// FIREBASE-BASIS ANFANG
export async function ladeSpitzname(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/spitzname`));
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}
export async function spitznameVorhanden(name) {
  try {
    const snap = await get(child(ref(db), `spitznamen/${name.toLowerCase()}`));
    return snap.exists();
  } catch(e) { return false; }
}
export async function speichereSpitzname(uid, name) {
  try {
    await set(ref(db, `spieler/${uid}/spitzname`), name);
    await set(ref(db, `spitznamen/${name.toLowerCase()}`), uid);
  } catch(e) {}
}
export async function aendereSpitzname(uid, alterName, neuerName) {
  try {
    if (alterName) await set(ref(db, `spitznamen/${alterName.toLowerCase()}`), null);
    await set(ref(db, `spieler/${uid}/spitzname`), neuerName);
    await set(ref(db, `spitznamen/${neuerName.toLowerCase()}`), uid);
  } catch(e) {}
}
export async function ladeRanglisteFirebase(idx) {
  try {
    const snap = await get(child(ref(db), `ranglisten/${idx}`));
    if (snap.exists()) {
      return Object.values(snap.val()).sort((a,b) => {
        const aGew = !a.gewonnen===false && a.versuche < 99;
        const bGew = !b.gewonnen===false && b.versuche < 99;
        if (aGew && !bGew) return -1;
        if (!aGew && bGew) return 1;
        if (aGew && bGew) return a.versuche !== b.versuche ? a.versuche-b.versuche : a.sekunden-b.sekunden;
        return a.sekunden-b.sekunden;
      });
    }
    return [];
  } catch(e) { return []; }
}
export async function speichereInRanglisteFirebase() {
  if (!appState.currentSpitzname || !appState.currentUser) return;
  try {
    const k = appState.currentSpitzname.toLowerCase().replace(/[^a-z0-9]/g,'_');
    // Prüfen ob bereits eingetragen
    const snap = await get(child(ref(db), `ranglisten/${TAGES_IDX}/${k}`));
    if (snap.exists()) return; // Bereits eingetragen
    const sek = state.endZeit ? Math.floor((state.endZeit-state.startZeit)/1000) : 9999;
    // Nur den eigenen Eintrag schreiben — nicht das gesamte Objekt
    await set(ref(db, `ranglisten/${TAGES_IDX}/${k}`), {
      name: appState.currentSpitzname,
      versuche: state.gewonnen ? state.versuche.length : 99,
      sekunden: sek,
      gewonnen: state.gewonnen
    });
    if (state.gewonnen) {
      await aktualisiereGlobaleBestOfTime(TAGES_IDX);
      await aktualisiereGruppenNachSpiel(TAGES_IDX);
    }
    await speichereHistorieFirebase(appState.currentUser.uid, TAGES_IDX, {
      woerter: state.versuche,
      sekunden: sek,
      gewonnen: state.gewonnen
    });
    console.log('Rangliste gespeichert:', appState.currentSpitzname);
  } catch(e) { console.error('Rangliste Fehler:', e); }
}
export async function aktualisiereGlobaleBestOfTime(tagIdx) {
  try {
    const liste = await ladeRanglisteFirebase(tagIdx);
    if (liste.length < 3) return;
    const gewinner = liste[0];
    if (!gewinner) return;
    const idx4 = tagIdx - 4;
    const idx3 = tagIdx - 3;
    const idx2 = tagIdx - 2;
    if (idx4 >= 0) {
      const liste4 = await ladeRanglisteFirebase(idx4);
      const liste3 = await ladeRanglisteFirebase(idx3);
      const liste2 = await ladeRanglisteFirebase(idx2);
      const mittelwert = (liste4.length + liste3.length + liste2.length) / 3;
      const minSpieler = mittelwert / 3;
      if (liste.length < minSpieler) return;
    }
    const k = gewinner.name.toLowerCase().replace(/[^a-z0-9]/g,'_');
    const snap = await get(child(ref(db), `bestOfTime/${k}`));
    const punkte = snap.exists() ? (snap.val().punkte||0) : 0;
    await set(ref(db, `bestOfTime/${k}`), {name:gewinner.name, punkte:punkte+1});
  } catch(e) {}
}
export async function ladeBestOfTime() {
  try {
    const snap = await get(child(ref(db), 'bestOfTime'));
    if (!snap.exists()) return [];
    return Object.values(snap.val()).sort((a,b) => b.punkte-a.punkte);
  } catch(e) { return []; }
}
export async function speichereStreakFirebase(uid, streak, maxStreak, letzterGewinn) {
  try {
    await set(ref(db, `spieler/${uid}/streak`), { streak, maxStreak, letzterGewinn });
  } catch(e) {}
}
export async function ladeStreakFirebase(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/streak`));
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}
export async function speichereRekordFirebase(uid, rekord) {
  try {
    await set(ref(db, `spieler/${uid}/rekord`), rekord);
  } catch(e) {}
}
export async function ladeRekordFirebase(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/rekord`));
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}
export async function speichereHistorieFirebase(uid, tagIdx, daten) {
  try {
    await set(ref(db, `spieler/${uid}/historie/${tagIdx}`), daten);
  } catch(e) {}
}
export async function ladeHistorieFirebase(uid, tagIdx) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/historie/${tagIdx}`));
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}
// FIREBASE-BASIS ENDE
