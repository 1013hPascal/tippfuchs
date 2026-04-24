import { db, ref, set, get, child } from './firebase-config.js';
import { appState } from './state.js';
import { sageLaut } from './live-region.js';
import { LOESUNGSWOERTER } from './loesungswoerter.js';
import { zeigeScreen } from './screens.js';

// DUELLE ANFANG
const ABLAUF_MS = 24 * 60 * 60 * 1000;
const PENDING_KEY = 'wj_pending_duelle';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function erstelleDuell(typ, loesung, verhextesWort = null) {
  if (!appState.currentUser) return null;
  const id = genId();
  const jetzt = Date.now();
  const d = {
    typ,
    loesung: loesung.toUpperCase(),
    erstelltVon: appState.currentUser.uid,
    erstelltVonName: appState.currentSpitzname,
    erstelltAm: jetzt,
    laeuftAbAm: jetzt + ABLAUF_MS,
    status: 'offen'
  };
  if (verhextesWort) d.verhextesWort = verhextesWort.toUpperCase();
  await set(ref(db, `duelle/${id}`), d);
  return id;
}

export function zufallsWort() {
  return LOESUNGSWOERTER[Math.floor(Math.random() * LOESUNGSWOERTER.length)];
}

export function duellLink(id) {
  return `https://blindmove.blogspot.com/p/tippfuchs.html?duell=${id}`;
}

export async function teileDuell(id) {
  const link = duellLink(id);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Tippfuchs Duell', text: '🦊 Kannst du dieses Wort lösen?', url: link });
      return true;
    } catch(e) {}
  }
  try {
    await navigator.clipboard.writeText(link);
    sageLaut('Link in Zwischenablage kopiert.');
    return true;
  } catch(e) {}
  return false;
}

export async function ladeVonMirGestellte(userId) {
  try {
    const snap = await get(child(ref(db), 'duelle'));
    if (!snap.exists()) return [];
    const jetzt = Date.now();
    return Object.entries(snap.val())
      .filter(([, d]) => d.erstelltVon === userId && d.laeuftAbAm > jetzt)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.erstelltAm - a.erstelltAm);
  } catch(e) { return []; }
}

export function ladePendingIds() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch(e) { return []; }
}

export function speicherePendingId(id) {
  const l = ladePendingIds().filter(i => i !== id);
  l.unshift(id);
  localStorage.setItem(PENDING_KEY, JSON.stringify(l.slice(0, 20)));
}

export async function ladeFuerMichZuLoesen(userId) {
  const ids = ladePendingIds();
  if (!ids.length) return [];
  const jetzt = Date.now();
  const res = [];
  for (const id of ids) {
    try {
      const snap = await get(child(ref(db), `duelle/${id}`));
      if (!snap.exists()) continue;
      const d = snap.val();
      if (d.laeuftAbAm <= jetzt) continue;
      if (d.erstelltVon === userId && d.typ !== 'fuchsjagd') continue;
      if (d.typ === 'fuchsjagd' && d.erstelltVon === userId && d.ergebnis_steller?.gespielt) continue;
      if (d.typ !== 'fuchsjagd' && d.ergebnis_rater?.gespielt) continue;
      if (d.typ === 'fuchsjagd' && d.erstelltVon !== userId && d.ergebnis_rater?.gespielt) continue;
      res.push({ id, ...d });
    } catch(e) {}
  }
  return res;
}

export async function ladeDuell(id) {
  try {
    const snap = await get(child(ref(db), `duelle/${id}`));
    return snap.exists() ? { id, ...snap.val() } : null;
  } catch(e) { return null; }
}

// Ergebnis in Firebase speichern
export async function speichereDuellErgebnis(duell, gewonnen, versuche, sekunden, extra = {}) {
  if (!appState.currentUser) return;
  const istSteller = duell.erstelltVon === appState.currentUser.uid;
  const ergebnisKey = istSteller ? 'ergebnis_steller' : 'ergebnis_rater';
  const ergebnis = { gespielt: true, gewonnen, versuche, sekunden: sekunden || 0, ...extra };
  await set(ref(db, `duelle/${duell.id}/${ergebnisKey}`), ergebnis);

  // Status auf abgeschlossen setzen (außer Fuchsjagd: erst wenn beide gespielt)
  if (duell.typ !== 'fuchsjagd') {
    await set(ref(db, `duelle/${duell.id}/status`), 'abgeschlossen');
  } else if (!istSteller) {
    const snap = await get(child(ref(db), `duelle/${duell.id}/ergebnis_steller`));
    if (snap.exists()) await set(ref(db, `duelle/${duell.id}/status`), 'abgeschlossen');
  } else {
    const snap = await get(child(ref(db), `duelle/${duell.id}/ergebnis_rater`));
    if (snap.exists()) await set(ref(db, `duelle/${duell.id}/status`), 'abgeschlossen');
  }
}

// Duell-Ergebnis-Bereich im ergebnis-screen befüllen
export async function zeigeDuellErgebnisBereich(gewonnen, extra = {}) {
  const bereich = document.getElementById('duell-ergebnis-bereich');
  const textEl = document.getElementById('duell-ergebnis-text');
  const emojiPicker = document.getElementById('emoji-picker');
  const zurueckBtn = document.getElementById('btn-zurueck-zu-duelle');
  if (!bereich || !textEl) return;

  bereich.style.display = 'flex';
  if (zurueckBtn) zurueckBtn.style.display = 'block';

  const duell = appState.duellModus;
  const istSteller = duell?.erstelltVon === appState.currentUser?.uid;

  let text = '';

  if (duell?.typ === 'vergiftetes_wort' && extra.verhextGetroffen) {
    if (extra.raterGewinnt) {
      text = `🎉 Du hast das verhexte Wort in Versuch ${extra.versuchsNummer} getippt — aber das war einer der ersten zwei Versuche, also gewinnst trotzdem <strong>du</strong>!`;
    } else {
      text = `💀 Du hast das verhexte Wort getippt! Damit gewinnt der Wortgeber. Versuche: ${extra.versuchsNummer}`;
    }
  } else if (duell?.typ === 'fuchsjagd') {
    const ergebnisKey = istSteller ? 'ergebnis_steller' : 'ergebnis_rater';
    const gegnerKey = istSteller ? 'ergebnis_rater' : 'ergebnis_steller';
    try {
      const gegnerSnap = await get(child(ref(db), `duelle/${duell.id}/${gegnerKey}`));
      if (gegnerSnap.exists()) {
        const g = gegnerSnap.val();
        const meinVersuche = extra.versuche || 0;
        const gegnerVersuche = g.versuche;
        if (!gewonnen) {
          text = `Du hast das Wort nicht gelöst. Dein Gegner: ${gegnerVersuche} Versuch${gegnerVersuche !== 1 ? 'e' : ''} → <strong>Gegner gewinnt</strong>`;
        } else if (!g.gewonnen) {
          text = `Du hast gewonnen mit ${meinVersuche} Versuch${meinVersuche !== 1 ? 'en' : ''}. Dein Gegner hat nicht gelöst 🏆`;
        } else {
          const ichGewonnen = meinVersuche < gegnerVersuche || (meinVersuche === gegnerVersuche && (extra.sekunden || 0) < (g.sekunden || 0));
          text = ichGewonnen
            ? `🏆 Gewonnen! Du: ${meinVersuche} Versuche, Gegner: ${gegnerVersuche} Versuche`
            : `Verloren. Du: ${meinVersuche} Versuche, Gegner: ${gegnerVersuche} Versuche`;
        }
      } else {
        text = `Dein Ergebnis wurde gespeichert. Warte bis dein Gegner gespielt hat — dann siehst du das Ergebnis hier.`;
      }
    } catch(e) { text = 'Ergebnis gespeichert.'; }
  } else {
    text = gewonnen ? '🎉 Duell gelöst!' : `Das Wort war <strong>${duell?.loesung || ''}</strong>`;
  }

  textEl.innerHTML = text;

  // Emoji-Picker für Wortfuchs (nur für den Rater)
  if (emojiPicker && duell?.typ === 'wortfuchs' && !istSteller) {
    emojiPicker.style.display = 'flex';
  }
}

export async function speichereEmojiReaktion(duellId, emoji) {
  await set(ref(db, `duelle/${duellId}/ergebnis_rater/emojiReaktion`), emoji);
}

export async function zeigeStartDuelleStats(userId) {
  const inhalt = document.getElementById('duelle-stats-inhalt');
  if (!inhalt) return;
  inhalt.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Wird geladen…</span>';
  try {
    const snap = await get(child(ref(db), 'duelle'));
    const s = {
      verhext_gestellt: { gespielt: 0, gewonnen: 0 },
      verhext_geloest:  { gespielt: 0, gewonnen: 0 },
      fuchsrennen:      { gespielt: 0, gewonnen: 0 },
      fuchswort:        { gespielt: 0, geloest: 0 }
    };
    if (snap.exists()) {
      const pendingIds = new Set(ladePendingIds());
      for (const [id, d] of Object.entries(snap.val())) {
        const istSteller = d.erstelltVon === userId;
        const istRater = !istSteller && pendingIds.has(id);
        if (!istSteller && !istRater) continue;
        const rg = d.ergebnis_rater;
        const sg = d.ergebnis_steller;
        if (d.typ === 'vergiftetes_wort') {
          if (istSteller && rg?.gespielt) {
            s.verhext_gestellt.gespielt++;
            if (!rg.raterGewinnt) s.verhext_gestellt.gewonnen++;
          } else if (istRater && rg?.gespielt) {
            s.verhext_geloest.gespielt++;
            if (rg.raterGewinnt) s.verhext_geloest.gewonnen++;
          }
        } else if (d.typ === 'fuchsjagd' && sg?.gespielt && rg?.gespielt) {
          s.fuchsrennen.gespielt++;
          const ichGewann = istSteller
            ? (sg.versuche < rg.versuche || (sg.versuche === rg.versuche && sg.sekunden < rg.sekunden))
            : (rg.versuche < sg.versuche || (rg.versuche === sg.versuche && rg.sekunden < sg.sekunden));
          if (ichGewann) s.fuchsrennen.gewonnen++;
        } else if (d.typ === 'wortfuchs' && istRater && rg?.gespielt) {
          s.fuchswort.gespielt++;
          if (rg.gewonnen) s.fuchswort.geloest++;
        }
      }
    }
    const pct = (n, d) => d === 0 ? '—' : `${Math.round(n / d * 100)}%`;
    inhalt.innerHTML = [
      `<div style="font-size:.85rem;color:var(--text-muted);">${pct(s.verhext_gestellt.gewonnen, s.verhext_gestellt.gespielt)} der gestellten verhexten Wörter gewonnen (${s.verhext_gestellt.gewonnen} von ${s.verhext_gestellt.gespielt})</div>`,
      `<div style="font-size:.85rem;color:var(--text-muted);">${pct(s.verhext_geloest.gewonnen, s.verhext_geloest.gespielt)} der gelösten verhexten Duelle gewonnen (${s.verhext_geloest.gewonnen} von ${s.verhext_geloest.gespielt})</div>`,
      `<div style="font-size:.85rem;color:var(--text-muted);">${pct(s.fuchsrennen.gewonnen, s.fuchsrennen.gespielt)} der Fuchsrennen gewonnen (${s.fuchsrennen.gewonnen} von ${s.fuchsrennen.gespielt})</div>`,
      `<div style="font-size:.85rem;color:var(--text-muted);">${s.fuchswort.geloest} von ${s.fuchswort.gespielt} Fuchswörtern gelöst</div>`
    ].join('');
  } catch(e) {
    inhalt.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Fehler beim Laden.</span>';
  }
}

const TYP_LABEL = {
  vergiftetes_wort: 'Das verhexte Wort',
  fuchsjagd: 'Das Fuchsrennen',
  wortfuchs: 'Das Fuchswort'
};

export function duellTypLabel(typ) { return TYP_LABEL[typ] || typ; }

export async function zeigeMeineDuelleInhalt() {
  const fuerMichEl = document.getElementById('duelle-fuer-mich-liste');
  const vonMirEl = document.getElementById('duelle-von-mir-liste');
  if (!fuerMichEl || !vonMirEl) return;

  if (!appState.currentUser) {
    fuerMichEl.innerHTML = '<p style="font-size:.85rem;color:var(--text-muted);">Bitte melde dich an um Duelle zu sehen.</p>';
    vonMirEl.innerHTML = '';
    return;
  }

  fuerMichEl.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Wird geladen…</span>';
  vonMirEl.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Wird geladen…</span>';

  const [fuerMich, vonMir] = await Promise.all([
    ladeFuerMichZuLoesen(appState.currentUser.uid),
    ladeVonMirGestellte(appState.currentUser.uid)
  ]);

  fuerMichEl.innerHTML = fuerMich.length
    ? fuerMich.map(d => duellListenEintrag(d, 'rater')).join('')
    : '<p style="font-size:.85rem;color:var(--text-muted);">Keine offenen Duelle für dich.</p>';

  vonMirEl.innerHTML = vonMir.length
    ? vonMir.map(d => duellListenEintrag(d, 'steller')).join('')
    : '<p style="font-size:.85rem;color:var(--text-muted);">Du hast noch keine Duelle gestellt.</p>';
}

function duellListenEintrag(d, perspektive) {
  const label = duellTypLabel(d.typ);
  const stil = 'text-align:left;font-size:.88rem;';

  if (perspektive === 'steller') {
    if (d.typ === 'fuchsjagd') {
      const sg = d.ergebnis_steller;
      if (!sg?.gespielt) {
        return `<button class="btn-secondary" data-duell-id="${d.id}" data-perspektive="steller" style="${stil}">⚔️ ${label} — Dein Zug fehlt noch → Jetzt spielen</button>`;
      }
      const rg = d.ergebnis_rater;
      if (!rg?.gespielt) {
        return `<div style="padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:.88rem;">⚔️ ${label} — Du: ${sg.versuche} Versuche — Warte auf Gegner…</div>`;
      }
      const ichGewann = sg.versuche < rg.versuche || (sg.versuche === rg.versuche && sg.sekunden < rg.sekunden);
      return `<div style="padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:.88rem;">⚔️ ${label} — Du: ${sg.versuche} | Gegner: ${rg.versuche} → ${ichGewann ? '🏆 Gewonnen' : 'Verloren'}</div>`;
    }
    // Wortfuchs / Vergiftetes Wort — nur Status
    const rg = d.ergebnis_rater;
    if (!rg?.gespielt) {
      return `<div style="padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:.88rem;">⚔️ ${label} — Noch nicht gespielt</div>`;
    }
    let resultat = '';
    if (d.typ === 'vergiftetes_wort') {
      resultat = rg.raterGewinnt ? 'Gegner hat gewonnen' : '🏆 Du hast gewonnen';
    } else {
      const emoji = rg.emojiReaktion ? ` ${rg.emojiReaktion}` : '';
      resultat = rg.gewonnen ? `gelöst in ${rg.versuche} Versuch${rg.versuche !== 1 ? 'en' : ''}${emoji}` : `nicht gelöst${emoji}`;
    }
    return `<div style="padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);font-size:.88rem;">⚔️ ${label} — ${resultat}</div>`;
  }

  // Rater (für mich zu lösen)
  return `<button class="btn-secondary" data-duell-id="${d.id}" data-perspektive="rater" style="${stil}">⚔️ ${label} — gestellt von ${d.erstelltVonName} → Jetzt lösen</button>`;
}
// DUELLE ENDE
