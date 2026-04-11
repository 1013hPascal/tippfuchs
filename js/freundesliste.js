import { appState } from './state.js';
import { db, ref, get, set, child, remove } from './firebase-config.js';

// FREUNDESLISTE ANFANG
export async function ladeFriendesliste() {
  if (!appState.currentUser) return [];
  try {
    const snap = await get(child(ref(db), `spieler/${appState.currentUser.uid}/freunde`));
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  } catch(e) { return []; }
}
export async function fuegeFreundHinzu(name) {
  if (!appState.currentUser) return;
  try {
    const k = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
    await set(ref(db, `spieler/${appState.currentUser.uid}/freunde/${k}`), {name});
  } catch(e) {}
}
export async function entferneFreund(name) {
  if (!appState.currentUser) return;
  try {
    const k = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
    await remove(ref(db, `spieler/${appState.currentUser.uid}/freunde/${k}`));
  } catch(e) {}
}
export async function sucheSpielernamen(suchtext) {
  if (!suchtext || suchtext.length < 2) return [];
  try {
    const snap = await get(child(ref(db), 'spitznamen'));
    if (!snap.exists()) return [];
    const alle = Object.keys(snap.val());
    return alle.filter(n => n.includes(suchtext.toLowerCase()) && n !== appState.currentSpitzname?.toLowerCase()).slice(0,20);
  } catch(e) { return []; }
}
// FREUNDESLISTE ENDE
