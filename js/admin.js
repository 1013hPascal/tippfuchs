import { appState } from './state.js';
import { db, ref, get, child } from './firebase-config.js';

// ADMIN DASHBOARD ANFANG
const ADMIN_EMAIL = 'blindermoveindeutschland@gmail.com';

export async function zeigeAdminBereich() {
  const bereich = document.getElementById('admin-bereich');
  const pushBereich = document.getElementById('push-bereich');
  if (!bereich) return;
  if (!appState.currentUser || appState.currentUser.email !== ADMIN_EMAIL) {
    bereich.style.display = 'none';
    if (pushBereich) pushBereich.style.display = 'none';
    return;
  }
  bereich.style.display = 'block';
  if (pushBereich) pushBereich.style.display = 'flex';
  document.getElementById('admin-lade-status').textContent = 'Lade Daten...';
  document.getElementById('admin-box').style.display = 'none';

  try {
    // Nutzer aus "spieler" auslesen (dort werden alle gespeichert)
    const spielerSnap = await get(child(ref(db), 'spieler'));
    let emailCount = 0, googleCount = 0;

    if (spielerSnap.exists()) {
      const spieler = spielerSnap.val();
      // Spitznamen-Liste laden um Anzahl Accounts zu bestimmen
      const spitznamenSnap = await get(child(ref(db), 'spitznamen'));
      const anzahlSpieler = spielerSnap.exists() ? Object.keys(spieler).length : 0;

      // Google vs Email: schauen ob uid mit typischem Google-Format anfängt
      // Zuverlässiger: einfach Gesamtzahl zeigen, Google-Erkennung über Auth nicht möglich aus DB
      googleCount = 0;
      emailCount = 0;
      Object.entries(spieler).forEach(([uid, daten]) => {
        // Firebase Google UIDs sind typischerweise lange Zahlen
        // Email-Auth UIDs können alles sein
        // Wir zählen einfach alle Accounts
        emailCount++;
      });
      googleCount = 0; // Kann aus DB nicht zuverlässig bestimmt werden
    }

    // Gruppen zählen
    const gruppenSnap = await get(child(ref(db), 'gruppen'));
    const gruppenAnzahl = gruppenSnap.exists() ? Object.keys(gruppenSnap.val()).length : 0;

    // Freundeslisten zählen (gespeichert unter spieler/$uid/freunde)
    let freundeAnzahl = 0;
    if (spielerSnap.exists()) {
      Object.values(spielerSnap.val()).forEach(s => {
        if (s.freunde && Object.keys(s.freunde).length > 0) freundeAnzahl++;
      });
    }

    // Gesamtzahl Accounts
    const gesamt = spielerSnap.exists() ? Object.keys(spielerSnap.val()).length : 0;

    // Anzeige
    document.getElementById('admin-email-accounts').textContent = `Accounts gesamt: ${gesamt}`;
    document.getElementById('admin-google-accounts').textContent = `Nutzer mit Freundesliste: ${freundeAnzahl}`;
    document.getElementById('admin-gesamt-accounts').textContent = `Gruppen erstellt: ${gruppenAnzahl}`;
    document.getElementById('admin-gruppen').style.display = 'none';
    document.getElementById('admin-freundeslisten').style.display = 'none';

    // Jahr-Select befüllen
    const jahrSel = document.getElementById('admin-jahr-select');
    const jetzt = new Date();
    const aktJahr = jetzt.getFullYear();
    jahrSel.innerHTML = '';
    for (let j = aktJahr; j >= 2025; j--) {
      const o = document.createElement('option');
      o.value = j; o.textContent = j;
      jahrSel.appendChild(o);
    }

    // Woche-Select befüllen
    await adminBefuelleWochenSelect();
    jahrSel.addEventListener('change', adminBefuelleWochenSelect);

    document.getElementById('admin-lade-status').textContent = '';
    document.getElementById('admin-box').style.display = 'block';

  } catch(e) {
    console.error('Admin Fehler:', e);
    document.getElementById('admin-lade-status').textContent = 'Fehler beim Laden: ' + e.message;
  }
}

async function adminBefuelleWochenSelect() {
  const jahrSel = document.getElementById('admin-jahr-select');
  const wocheSel = document.getElementById('admin-woche-select');
  if (!jahrSel || !wocheSel) return;
  const jahr = parseInt(jahrSel.value);

  // Wieviele Wochen hat das Jahr?
  const letzterTag = new Date(jahr, 11, 31);
  const woche1Start = new Date(jahr, 0, 1);
  const anzahlWochen = Math.ceil(((letzterTag - woche1Start) / 86400000 + 1) / 7);

  wocheSel.innerHTML = '';
  for (let w = 1; w <= anzahlWochen; w++) {
    const o = document.createElement('option');
    o.value = w;
    // Datum der Woche berechnen
    const wStart = new Date(jahr, 0, 1 + (w-1)*7);
    const wEnd = new Date(jahr, 0, 7 + (w-1)*7);
    const fmt = d => `${d.getDate()}.${d.getMonth()+1}.`;
    o.textContent = `Woche ${w} (${fmt(wStart)} - ${fmt(wEnd)})`;
    wocheSel.appendChild(o);
  }

  // Aktuelle Woche vorauswählen
  if (jahr === new Date().getFullYear()) {
    const heute = new Date();
    const startJahr = new Date(heute.getFullYear(), 0, 1);
    const aktWoche = Math.ceil(((heute - startJahr) / 86400000 + startJahr.getDay() + 1) / 7);
    wocheSel.value = Math.min(aktWoche, anzahlWochen);
  }

  wocheSel.removeEventListener('change', adminLadeWoche);
  wocheSel.addEventListener('change', adminLadeWoche);
  await adminLadeWoche();
}

async function adminLadeWoche() {
  const jahr = parseInt(document.getElementById('admin-jahr-select').value);
  const woche = parseInt(document.getElementById('admin-woche-select').value);
  const el = document.getElementById('admin-spiele-woche');
  el.textContent = 'Lade...';

  try {
    // Alle Tage dieser Woche berechnen
    const startJahr = new Date(jahr, 0, 1);
    const startOffset = Date.UTC(jahr, 0, 1);
    const wocheStartTag = (woche - 1) * 7; // Tag des Jahres (0-basiert)
    const wocheEndeTag = wocheStartTag + 6;

    // TAGES_IDX für diese Woche
    const idxStart = Math.floor((Date.UTC(jahr, 0, 1) + wocheStartTag * 86400000 - Date.UTC(2025, 0, 1)) / 86400000);
    const idxEnde = Math.floor((Date.UTC(jahr, 0, 1) + wocheEndeTag * 86400000 - Date.UTC(2025, 0, 1)) / 86400000);

    let gesamtSpiele = 0;
    for (let idx = Math.max(0, idxStart); idx <= idxEnde; idx++) {
      const snap = await get(child(ref(db), `ranglisten/${idx}`));
      if (snap.exists()) {
        gesamtSpiele += Object.keys(snap.val()).length;
      }
    }
    el.textContent = `Spiele in dieser Woche: ${gesamtSpiele}`;
  } catch(e) {
    el.textContent = 'Fehler: ' + e.message;
  }
}
// ADMIN DASHBOARD ENDE
