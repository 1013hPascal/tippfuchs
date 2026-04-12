import { appState } from './state.js';
import { db, ref, get, set, child, remove } from './firebase-config.js';
import { ladeRanglisteFirebase } from './firebase-basis.js';

// GRUPPEN SELBST-SYNC
export async function syncGruppenBeiLogin(uid) {
  // Prüfe alle Gruppen ob dieser Nutzer als Mitglied eingetragen ist
  // aber noch nicht in spieler/$uid/gruppen steht
  try {
    const gruppenSnap = await get(child(ref(db), 'gruppen'));
    if (!gruppenSnap.exists()) return;
    const gruppen = gruppenSnap.val();
    const eigeneGruppenSnap = await get(child(ref(db), `spieler/${uid}/gruppen`));
    const eigeneGruppen = eigeneGruppenSnap.exists() ? eigeneGruppenSnap.val() : {};

    for (const [gruppenId, gruppe] of Object.entries(gruppen)) {
      if (gruppe.mitglieder?.[uid] && !eigeneGruppen[gruppenId]) {
        // Bin Mitglied aber nicht eingetragen — selbst eintragen
        await set(ref(db, `spieler/${uid}/gruppen/${gruppenId}`), true);
        console.log('Gruppen-Sync: Gruppe', gruppenId, 'nachgetragen');
      }
    }
  } catch(e) {
    console.log('Gruppen-Sync Fehler:', e);
  }
}


// GRUPPEN ANFANG
function generiereGruppenId() {
  const z = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i=0; i<8; i++) id += z[Math.floor(Math.random()*z.length)];
  return id;
}
export async function erstelleGruppe(name) {
  if (!appState.currentUser || !appState.currentSpitzname) return null;
  try {
    let gruppenId; let v=0;
    do {
      gruppenId = generiereGruppenId();
      const snap = await get(child(ref(db), `gruppen/${gruppenId}`));
      if (!snap.exists()) break;
      v++;
    } while (v < 10);
    const gruppe = {
      name, id:gruppenId, erstellt:Date.now(),
      mitglieder:{[appState.currentUser.uid]:{name:appState.currentSpitzname, beigetreten:Date.now()}}
    };
    await set(ref(db, `gruppen/${gruppenId}`), gruppe);
    await set(ref(db, `spieler/${appState.currentUser.uid}/gruppen/${gruppenId}`), true);
    return gruppenId;
  } catch(e) { return null; }
}
export async function ladeGruppen() {
  if (!appState.currentUser) return [];
  try {
    const snap = await get(child(ref(db), `spieler/${appState.currentUser.uid}/gruppen`));
    if (!snap.exists()) return [];
    const ids = Object.keys(snap.val());
    const gruppen = [];
    for (const id of ids) {
      const g = await get(child(ref(db), `gruppen/${id}`));
      if (g.exists()) gruppen.push({id, ...g.val()});
    }
    return gruppen;
  } catch(e) { return []; }
}
export async function ladeGruppe(id) {
  try {
    const snap = await get(child(ref(db), `gruppen/${id}`));
    return snap.exists() ? {id, ...snap.val()} : null;
  } catch(e) { return null; }
}
export async function sendeAnfrage(gruppenId) {
  if (!appState.currentUser || !appState.currentSpitzname) return false;
  try {
    const g = await get(child(ref(db), `gruppen/${gruppenId}`));
    if (!g.exists()) return false;
    const gd = g.val();
    if (gd.mitglieder?.[appState.currentUser.uid]) return 'bereits';
    if (gd.anfragen?.[appState.currentUser.uid]) return 'ausstehend';
    await set(ref(db, `gruppen/${gruppenId}/anfragen/${appState.currentUser.uid}`), {
      name:appState.currentSpitzname, uid:appState.currentUser.uid, zeit:Date.now()
    });
    // Auch auf user-Seite speichern, damit eigene ausstehende Anfragen angezeigt werden können
    await set(ref(db, `spieler/${appState.currentUser.uid}/anfragen/${gruppenId}`), {
      name:gd.name, zeit:Date.now()
    });
    return true;
  } catch(e) { return false; }
}
export async function ladeEigeneAnfragen() {
  if (!appState.currentUser) return [];
  try {
    const snap = await get(child(ref(db), `spieler/${appState.currentUser.uid}/anfragen`));
    if (!snap.exists()) return [];
    const anfragen = [];
    for (const [gruppenId, daten] of Object.entries(snap.val())) {
      // Prüfen ob die Anfrage noch wirklich aussteht (nicht schon angenommen/abgelehnt)
      const gruppenAnfrageSnap = await get(child(ref(db), `gruppen/${gruppenId}/anfragen/${appState.currentUser.uid}`));
      if (gruppenAnfrageSnap.exists()) {
        anfragen.push({ id: gruppenId, name: daten.name });
      } else {
        // Nicht mehr ausstehend — aufräumen
        await remove(ref(db, `spieler/${appState.currentUser.uid}/anfragen/${gruppenId}`));
      }
    }
    return anfragen;
  } catch(e) { return []; }
}
export async function nimmAnfrageAn(gruppenId, uid, name) {
  try {
    await set(ref(db, `gruppen/${gruppenId}/mitglieder/${uid}`), {name, beigetreten:Date.now()});
    await remove(ref(db, `gruppen/${gruppenId}/anfragen/${uid}`));
    // Versuche in spieler/$uid/gruppen zu schreiben — kann fehlschlagen wegen Rules
    try {
      await set(ref(db, `spieler/${uid}/gruppen/${gruppenId}`), true);
    } catch(e) {
      // Kein Fehler — der Nutzer synct sich selbst beim nächsten Login
      console.log('Gruppen-Sync für anderen Nutzer nicht möglich, wird beim Login nachgeholt');
    }
  } catch(e) { console.error('Anfrage annehmen Fehler:', e); }
}
export async function lehnAnfrageAb(gruppenId, uid) {
  try {
    await remove(ref(db, `gruppen/${gruppenId}/anfragen/${uid}`));
  } catch(e) {}
}
export async function verlasseGruppe(gruppenId) {
  if (!appState.currentUser) return;
  try {
    await remove(ref(db, `gruppen/${gruppenId}/mitglieder/${appState.currentUser.uid}`));
    await remove(ref(db, `spieler/${appState.currentUser.uid}/gruppen/${gruppenId}`));
    const snap = await get(child(ref(db), `gruppen/${gruppenId}/mitglieder`));
    if (!snap.exists() || Object.keys(snap.val()).length === 0) {
      await remove(ref(db, `gruppen/${gruppenId}`));
    }
  } catch(e) {}
}
export async function aktualisiereGruppenNachSpiel(tagIdx) {
  if (!appState.currentUser || !appState.currentSpitzname) return;
  try {
    const snap = await get(child(ref(db), `spieler/${appState.currentUser.uid}/gruppen`));
    if (!snap.exists()) return;
    for (const gruppenId of Object.keys(snap.val())) {
      const gruppe = await ladeGruppe(gruppenId);
      if (!gruppe?.mitglieder) continue;
      const mitglieder = Object.keys(gruppe.mitglieder);
      const tagesListe = await ladeRanglisteFirebase(tagIdx);
      const gespielt = new Set(tagesListe.map(e=>e.name.toLowerCase()));
      if (!mitglieder.every(uid => gespielt.has(gruppe.mitglieder[uid].name.toLowerCase()))) continue;
      if (mitglieder.length < 2) continue;
      const bereitsSnap = await get(child(ref(db), `gruppen/${gruppenId}/gewerteteSpiele/${tagIdx}`));
      if (bereitsSnap.exists()) continue;
      for (const uid of mitglieder) {
        const mName = gruppe.mitglieder[uid].name.toLowerCase();
        const platz = tagesListe.findIndex(e=>e.name.toLowerCase()===mName)+1;
        if (platz > 0) {
          const pSnap = await get(child(ref(db), `gruppen/${gruppenId}/bestOfTime/${uid}`));
          const alt = pSnap.exists() ? pSnap.val() : {punkte:0, spiele:0};
          await set(ref(db, `gruppen/${gruppenId}/bestOfTime/${uid}`), {
            name:gruppe.mitglieder[uid].name,
            punkte:(alt.punkte||0)+platz,
            spiele:(alt.spiele||0)+1
          });
        }
      }
      await set(ref(db, `gruppen/${gruppenId}/gewerteteSpiele/${tagIdx}`), true);
    }
  } catch(e) {}
}
export async function ladeGruppenBestOfTime(gruppenId) {
  try {
    const snap = await get(child(ref(db), `gruppen/${gruppenId}/bestOfTime`));
    if (!snap.exists()) return {liste:[], anzahlSpiele:0};
    const spieleSnap = await get(child(ref(db), `gruppen/${gruppenId}/gewerteteSpiele`));
    const anzahlSpiele = spieleSnap.exists() ? Object.keys(spieleSnap.val()).length : 0;
    return {liste:Object.values(snap.val()).sort((a,b)=>a.punkte-b.punkte), anzahlSpiele};
  } catch(e) { return {liste:[], anzahlSpiele:0}; }
}
// GRUPPEN ENDE
