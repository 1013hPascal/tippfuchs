import { appState, state } from './state.js';
import { db, ref, get, child } from './firebase-config.js';
import { TAGES_IDX, HEUTE_KEY } from './tageswort.js';
import { getDatumVonIdx } from './hilfsfunktionen.js';
import { ladeRanglisteFirebase, ladeRekordFirebase, speichereRekordFirebase, ladeHistorieFirebase } from './firebase-basis.js';
import { formatZeit } from './timer.js';
import { bewerteVersuch } from './spiellogik.js';

// LOKALER-ZUSTAND ANFANG
export function ladeZustand() {
  try {
    const raw = localStorage.getItem(HEUTE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      state.versuche = s.versuche||[];
      state.spielende = s.spielende||false;
      state.gewonnen = s.gewonnen||false;
      state.endZeit = s.endZeit||null;
      state.startZeit = s.startZeit||null;
      state.ersterVersuchGemacht = state.versuche.length > 0;
      if (s.tageswort) appState.TAGESWORT = s.tageswort;
    }
  } catch(e) {}
}
export function speichereZustand() {
  try {
    localStorage.setItem(HEUTE_KEY, JSON.stringify({
      versuche:state.versuche, spielende:state.spielende,
      gewonnen:state.gewonnen, endZeit:state.endZeit,
      startZeit:state.startZeit, tageswort:appState.TAGESWORT
    }));
  } catch(e) {}
}
export function ladeStats() {
  try {
    return JSON.parse(localStorage.getItem('wj_stats')||'null') ||
      {gespielt:0,gewonnen:0,streak:0,maxStreak:0,distribution:[0,0,0,0,0,0],letzterGewinn:-1};
  } catch(e) {
    return {gespielt:0,gewonnen:0,streak:0,maxStreak:0,distribution:[0,0,0,0,0,0],letzterGewinn:-1};
  }
}
export function speichereStats(s) { try { localStorage.setItem('wj_stats',JSON.stringify(s)); } catch(e) {} }
export function aktualisiereStats(gewonnen, anzahl) {
  const s = ladeStats(); s.gespielt++;
  if (gewonnen) {
    s.gewonnen++;
    s.streak = (s.letzterGewinn===TAGES_IDX-1) ? s.streak+1 : 1;
    s.maxStreak = Math.max(s.maxStreak,s.streak);
    s.distribution[anzahl-1]++;
    s.letzterGewinn = TAGES_IDX;
  } else { s.streak = 0; }
  speichereStats(s);
}

// STREAK-UND-REKORD ANFANG
export function ladeRekordLokal() {
  try {
    return JSON.parse(localStorage.getItem('tippfuchs_rekord')||'null');
  } catch(e) { return null; }
}
export function speichereRekordLokal(rekord) {
  try { localStorage.setItem('tippfuchs_rekord', JSON.stringify(rekord)); } catch(e) {}
}
function istBesserAlsRekord(neuerVersuche, neueZeit, alterRekord) {
  if (!alterRekord) return true;
  if (neuerVersuche < alterRekord.versuche) return true;
  if (neuerVersuche === alterRekord.versuche && neueZeit < alterRekord.sekunden) return true;
  return false;
}
export async function aktualisiereRekord(versuche, sekunden, wort, datum) {
  const neuerRekord = {versuche, sekunden, wort, datum};
  const alterRekord = ladeRekordLokal();
  if (istBesserAlsRekord(versuche, sekunden, alterRekord)) {
    speichereRekordLokal(neuerRekord);
    if (appState.currentUser) await speichereRekordFirebase(appState.currentUser.uid, neuerRekord);
  }
}
export async function ladeRekordFuerAnzeige() {
  if (appState.currentUser) {
    const firebaseRekord = await ladeRekordFirebase(appState.currentUser.uid);
    const lokalerRekord = ladeRekordLokal();
    if (firebaseRekord && lokalerRekord) {
      if (istBesserAlsRekord(firebaseRekord.versuche, firebaseRekord.sekunden, lokalerRekord)) {
        speichereRekordLokal(firebaseRekord);
        return firebaseRekord;
      }
      return lokalerRekord;
    }
    if (firebaseRekord) { speichereRekordLokal(firebaseRekord); return firebaseRekord; }
  }
  return ladeRekordLokal();
}
export async function aktualisiereStartStats() {
  const stats = ladeStats();
  const streak = stats.streak || 0;
  const streakBox = document.getElementById('start-streak');
  const rekordBox = document.getElementById('start-rekord');
  const statsBox = document.getElementById('start-stats-box');
  if (!statsBox) return;
  statsBox.style.display = 'flex';
  if (streak > 0) {
    const flamme = streak >= 7 ? '🔥🔥' : '🔥';
    streakBox.textContent = `${flamme} ${streak} Tag${streak!==1?'e':''} in Folge gespielt`;
  } else {
    streakBox.textContent = 'Noch keine aktive Serie';
  }
  const rekord = await ladeRekordFuerAnzeige();
  if (rekord) {
    rekordBox.textContent = `Bestleistung: ${rekord.versuche} Versuch${rekord.versuche!==1?'e':''} in ${formatZeit(rekord.sekunden)} - ${rekord.wort} am ${rekord.datum}`;
  } else {
    rekordBox.textContent = 'Noch kein Rekord gespielt';
  }
  await ladeHistorieBereich();
}
export async function ladeHistorieBereich() {
  const keinAccount = document.getElementById('historie-kein-account');
  const mitAccount = document.getElementById('historie-mit-account');
  if (!appState.currentUser) {
    keinAccount.style.display = 'block';
    mitAccount.style.display = 'none';
    return;
  }
  keinAccount.style.display = 'none';
  mitAccount.style.display = 'flex';

  const sel = document.getElementById('historie-select');
  sel.innerHTML = '';
  for (let i=0; i<=30; i++) {
    const idx = TAGES_IDX - i;
    if (idx < 0) break;
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = i === 0 ? `Heute (${getDatumVonIdx(idx)})` : getDatumVonIdx(idx);
    sel.appendChild(opt);
  }

  const newSel = sel.cloneNode(true);
  sel.parentNode.replaceChild(newSel, sel);
  newSel.addEventListener('change', ladeHistorieErgebnis);
  await ladeHistorieErgebnis();
}

export async function ladeHistorieErgebnis() {
  const sel = document.getElementById('historie-select');
  const idx = parseInt(sel.value);
  if (isNaN(idx)) return;
  const div = document.getElementById('historie-ergebnis');
  div.style.display = 'flex';
  div.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Wird geladen...</span>';
  div.innerHTML = '';

  const istHeute = idx === TAGES_IDX;

  if (istHeute) {
    // Heute: Daten aus localStorage, keine Platzierung, kein Firebase-Abruf
    let lokalDaten = null;
    try {
      const raw = localStorage.getItem(HEUTE_KEY);
      if (raw) lokalDaten = JSON.parse(raw);
    } catch(e) {}

    if (!lokalDaten || !lokalDaten.versuche || lokalDaten.versuche.length === 0) {
      div.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Du hast heute noch nicht gespielt.</span>';
      return;
    }

    const loesung = lokalDaten.tageswort || appState.TAGESWORT || null;

    if (loesung) {
      const loesDiv = document.createElement('div');
      loesDiv.style.cssText = 'font-size:.9rem;';
      loesDiv.innerHTML = `<span style="font-weight:700;color:var(--text-muted);">Lösungswort:</span> <strong style="color:var(--text);">${loesung}</strong>`;
      div.appendChild(loesDiv);
    }

    const versuche = lokalDaten.versuche.length;
    const sekunden = lokalDaten.endZeit && lokalDaten.startZeit ? Math.floor((lokalDaten.endZeit - lokalDaten.startZeit) / 1000) : null;
    const versuchDiv = document.createElement('div');
    versuchDiv.style.cssText = 'font-size:.9rem;';
    versuchDiv.innerHTML = `<span style="font-weight:700;color:var(--text-muted);">Versuche${sekunden ? ' und Zeit' : ''}:</span> <strong style="color:var(--text);">${versuche} Versuch${versuche!==1?'e':''}${sekunden ? ' — ' + formatZeit(sekunden) : ''}</strong>`;
    div.appendChild(versuchDiv);

    if (loesung && lokalDaten.versuche.length > 0) {
      const woerterLabel = document.createElement('div');
      woerterLabel.style.cssText = 'font-size:.9rem;font-weight:700;color:var(--text-muted);margin-top:4px;';
      woerterLabel.textContent = 'Eingegebene Wörter:';
      div.appendChild(woerterLabel);
      lokalDaten.versuche.forEach((wort, idx2) => {
        const erg = bewerteVersuch(wort, loesung);
        const wortDiv = document.createElement('div');
        wortDiv.style.cssText = 'display:flex;gap:4px;align-items:center;';
        let html = `<span style="font-size:.85rem;color:var(--text-muted);min-width:20px;">${idx2+1}.</span>`;
        let srText = '';
        erg.forEach((e, i) => {
          const cls = e==='correct'?'correct':e==='present'?'present':'absent';
          const s = e==='correct'?'richtig':e==='present'?'falsche Stelle':'nicht vorhanden';
          html += `<span class="vb ${cls}" aria-hidden="true">${wort[i]}</span>`;
          srText += `${wort[i]}: ${s}, `;
        });
        html += `<span class="sr-only">${wort} — ${srText}</span>`;
        wortDiv.innerHTML = html;
        div.appendChild(wortDiv);
      });
    }
    return;
  }

  // Vergangene Tage: wie bisher
  let loesung = '-';
  try {
    const wSnap = await get(child(ref(db), `tageswoerter/${idx}`));
    if (wSnap.exists()) loesung = wSnap.val();
  } catch(e) {}

  const rangliste = await ladeRanglisteFirebase(idx);
  const platz = rangliste.findIndex(e => e.name.toLowerCase() === appState.currentSpitzname.toLowerCase()) + 1;
  const rangEintrag = rangliste.find(e => e.name.toLowerCase() === appState.currentSpitzname.toLowerCase());
  const historie = await ladeHistorieFirebase(appState.currentUser.uid, idx);

  if (platz === 0 && !historie) {
    div.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Du hast an diesem Tag nicht gespielt mit deinem Account.</span>';
    return;
  }

  const loesDiv = document.createElement('div');
  loesDiv.style.cssText = 'font-size:.9rem;';
  loesDiv.innerHTML = `<span style="font-weight:700;color:var(--text-muted);">Lösungswort:</span> <strong style="color:var(--text);">${loesung}</strong>`;
  div.appendChild(loesDiv);

  if (platz > 0) {
    const medal = platz===1?'🥇 ':platz===2?'🥈 ':platz===3?'🥉 ':'';
    const platzDiv = document.createElement('div');
    platzDiv.style.cssText = 'font-size:.9rem;';
    platzDiv.innerHTML = `<span style="font-weight:700;color:var(--text-muted);">Platzierung:</span> <strong style="color:var(--text);">${medal}${platz}. Platz von ${rangliste.length}</strong>`;
    div.appendChild(platzDiv);
  }

  const versuche = historie ? historie.woerter.length : (rangEintrag ? rangEintrag.versuche : '-');
  const sekunden = historie ? historie.sekunden : (rangEintrag ? rangEintrag.sekunden : null);
  const zeitStr = sekunden ? formatZeit(sekunden) : '-';
  const versuchDiv = document.createElement('div');
  versuchDiv.style.cssText = 'font-size:.9rem;';
  versuchDiv.innerHTML = `<span style="font-weight:700;color:var(--text-muted);">Versuche und Zeit:</span> <strong style="color:var(--text);">${versuche} Versuch${versuche!==1?'e':''} — ${zeitStr}</strong>`;
  div.appendChild(versuchDiv);

  if (historie && historie.woerter && loesung !== '-') {
    const woerterLabel = document.createElement('div');
    woerterLabel.style.cssText = 'font-size:.9rem;font-weight:700;color:var(--text-muted);margin-top:4px;';
    woerterLabel.textContent = 'Eingegebene Wörter:';
    div.appendChild(woerterLabel);
    historie.woerter.forEach((wort, idx2) => {
      const erg = bewerteVersuch(wort, loesung);
      const wortDiv = document.createElement('div');
      wortDiv.style.cssText = 'display:flex;gap:4px;align-items:center;';
      let html = `<span style="font-size:.85rem;color:var(--text-muted);min-width:20px;">${idx2+1}.</span>`;
      let srText = '';
      erg.forEach((e, i) => {
        const cls = e==='correct'?'correct':e==='present'?'present':'absent';
        const s = e==='correct'?'richtig':e==='present'?'falsche Stelle':'nicht vorhanden';
        html += `<span class="vb ${cls}" aria-hidden="true">${wort[i]}</span>`;
        srText += `${wort[i]}: ${s}, `;
      });
      html += `<span class="sr-only">${wort} — ${srText}</span>`;
      wortDiv.innerHTML = html;
      div.appendChild(wortDiv);
    });
  }
}
// STREAK-UND-REKORD ENDE
// LOKALER-ZUSTAND ENDE
