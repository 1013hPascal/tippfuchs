import { LOESUNGSWOERTER } from './loesungswoerter.js';
import { EINGABEWOERTER } from './eingabewoerter.js';
import { bewerteVersuch } from './spiellogik.js';
import { zeigeScreen } from './screens.js';
import { sageLaut } from './live-region.js';
import { appState } from './state.js';
import { db, ref, get, set, child } from './firebase-config.js';

// FUCHSFALLEN ANFANG

// Nur A–Z, keine Umlaute (Wortlisten enthalten keine Umlaute)
const TASTATUR_BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ff = {
  zielwort: null,
  fallenwort: null,
  versuche: [],
  maxVersuche: 6,
  verloreneVersuche: 0,
  geseheneLetters: new Set(),
  nieten: new Set(),
  fallen: new Set(),
  tastaturStatus: {},
  spielende: false,
  gewonnen: false
};

function zufIdx(n) { return Math.floor(Math.random() * n); }

export function starteFFSpiel() {
  ff.versuche = [];
  ff.maxVersuche = 6;
  ff.verloreneVersuche = 0;
  ff.geseheneLetters = new Set();
  ff.nieten = new Set();
  ff.fallen = new Set();
  ff.tastaturStatus = {};
  ff.spielende = false;
  ff.gewonnen = false;

  const w = LOESUNGSWOERTER;
  let i1 = zufIdx(w.length), i2;
  do { i2 = zufIdx(w.length); } while (i2 === i1);
  ff.zielwort = w[i1];
  ff.fallenwort = w[i2];

  _aktualisiereAnzeige();
  const inp = document.getElementById('ff-wort-input');
  if (inp) { inp.value = ''; inp.placeholder = '= = = = ='; inp.focus(); }
  document.getElementById('ff-fehler-msg').textContent = '';
  const ergBereich = document.getElementById('ff-ergebnis-bereich');
  if (ergBereich) ergBereich.style.display = 'none';

  sageLaut('Neues Fuchsfallen-Spiel! 6 Versuche. Errate das geheime Zielwort. Vorsicht vor Fuchsfallen!');
}

export function verarbeiteFFWort() {
  if (ff.spielende) return;
  const inp = document.getElementById('ff-wort-input');
  const versuch = (inp.value || '').trim().toUpperCase();
  const fehlerEl = document.getElementById('ff-fehler-msg');

  if (versuch.length !== 5) {
    fehlerEl.textContent = 'Bitte genau 5 Buchstaben eingeben.';
    sageLaut('Bitte genau 5 Buchstaben eingeben.');
    return;
  }
  // Wortlistenprüfung wie beim Tageswort: LOESUNGSWOERTER ist bereits uppercase,
  // EINGABEWOERTER ist gemischt → beim Vergleich uppercase erzwingen
  if (!LOESUNGSWOERTER.includes(versuch) && !EINGABEWOERTER.some(w => w.toUpperCase() === versuch)) {
    fehlerEl.textContent = 'Dieses Wort kennt der Fuchs nicht.';
    sageLaut('Dieses Wort kennt der Fuchs nicht.');
    inp.value = '';
    return;
  }

  // Weicher Hinweis nur visuell — kein eigener sageLaut (wird in Haupt-Ankündigung eingebaut)
  const hinweisBuchstaben = [...new Set(versuch.split(''))].filter(b =>
    ff.tastaturStatus[b] === 'absent' || ff.tastaturStatus[b] === 'falle'
  );
  fehlerEl.textContent = hinweisBuchstaben.length > 0
    ? `Hinweis: ${hinweisBuchstaben.join(', ')} bereits als nicht vorhanden bekannt.`
    : '';

  // Wie beim Tageswort: erst Eingabe leeren + Fokus setzen, dann sageLaut —
  // so unterbricht der Focus-Wechsel die live-region-Ankündigung nicht (iOS VoiceOver)
  inp.value = '';
  inp.focus();
  ff.versuche.push(versuch);

  const erg = bewerteVersuch(versuch, ff.zielwort);

  // Keyboard-Status für richtig/falsche Stelle aktualisieren
  erg.forEach((e, i) => {
    const b = versuch[i];
    const curr = ff.tastaturStatus[b];
    if (e === 'correct') ff.tastaturStatus[b] = 'correct';
    else if (e === 'present' && curr !== 'correct') ff.tastaturStatus[b] = 'present';
  });

  // Neue Buchstaben dieses Versuchs ermitteln (jeder nur einmal pro Spiel)
  const neueLetters = [];
  const dieserVersuch = new Set();
  for (const b of versuch) {
    if (!ff.geseheneLetters.has(b) && !dieserVersuch.has(b)) {
      neueLetters.push(b);
      dieserVersuch.add(b);
    }
    ff.geseheneLetters.add(b);
  }

  const fallenBuchstaben = [];
  const nietenEntfernt = [];

  for (const b of neueLetters) {
    const inZ = ff.zielwort.includes(b);
    const inF = ff.fallenwort.includes(b);
    if (inZ && inF) {
      nietenEntfernt.push(..._entferneNieten(1, b));
    } else if (inZ) {
      nietenEntfernt.push(..._entferneNieten(2, b));
    } else if (inF) {
      ff.fallen.add(b);
      ff.tastaturStatus[b] = 'falle';
      fallenBuchstaben.push(b);
    } else {
      if (!ff.tastaturStatus[b]) ff.tastaturStatus[b] = 'absent';
    }
  }

  // absent für restliche Buchstaben aus Wordle-Ergebnis setzen
  erg.forEach((e, i) => {
    const b = versuch[i];
    if (e === 'absent' &&
        ff.tastaturStatus[b] !== 'correct' &&
        ff.tastaturStatus[b] !== 'present' &&
        ff.tastaturStatus[b] !== 'falle') {
      ff.tastaturStatus[b] = 'absent';
    }
  });

  if (fallenBuchstaben.length > 0) ff.verloreneVersuche += 1;

  // Einziger sageLaut-Aufruf — gleicher Sprachstil wie Tageswort + Falle/Niete/Hinweis
  let sr = erg.map((e, i) => {
    const s = e === 'correct' ? 'richtige Stelle' : e === 'present' ? 'falsche Stelle' : 'kommt nicht vor';
    return `${versuch[i]}: ${s}`;
  }).join(', ');
  if (fallenBuchstaben.length > 0) {
    sr += `. Fuchsfalle! ${fallenBuchstaben.join(', ')} ${fallenBuchstaben.length > 1 ? 'waren' : 'war'} im Fallenwort. 1 Versuch verloren`;
  }
  if (nietenEntfernt.length > 0) {
    sr += `. Nieten enthüllt: ${nietenEntfernt.join(', ')}`;
  }
  if (hinweisBuchstaben.length > 0) {
    sr += `. Hinweis: ${hinweisBuchstaben.join(', ')} ${hinweisBuchstaben.length > 1 ? 'sind' : 'ist'} bereits als nicht vorhanden bekannt`;
  }

  const verfuegbar = ff.maxVersuche - ff.verloreneVersuche;
  if (versuch === ff.zielwort) {
    ff.spielende = true;
    ff.gewonnen = true;
    sr += `. Gewonnen! Das Zielwort war ${ff.zielwort}.`;
  } else if (ff.versuche.length >= verfuegbar) {
    ff.spielende = true;
    ff.gewonnen = false;
    sr += `. Verloren! Das Zielwort war ${ff.zielwort}. Das Fallenwort war ${ff.fallenwort}.`;
  } else {
    const muster = Array(5).fill('=');
    ff.versuche.forEach(v => {
      for (let i = 0; i < 5; i++) {
        if (v[i] === ff.zielwort[i]) muster[i] = v[i];
      }
    });
    sr += `. ${muster.join(' ')}`;
  }

  sageLaut(sr);
  _aktualisiereAnzeige();

  if (ff.spielende) {
    _zeigeErgebnis();
  }
}

function _entferneNieten(anzahl, ausschluss) {
  const kandidaten = TASTATUR_BUCHSTABEN.filter(b =>
    !ff.fallenwort.includes(b) &&
    !ff.nieten.has(b) &&
    !ff.fallen.has(b) &&
    !ff.geseheneLetters.has(b) &&
    b !== ausschluss &&
    ff.tastaturStatus[b] !== 'correct' &&
    ff.tastaturStatus[b] !== 'present' &&
    ff.tastaturStatus[b] !== 'absent'
  );
  const entfernt = [];
  for (let i = 0; i < anzahl && kandidaten.length > 0; i++) {
    const idx = zufIdx(kandidaten.length);
    const b = kandidaten.splice(idx, 1)[0];
    ff.nieten.add(b);
    ff.tastaturStatus[b] = 'niete';
    entfernt.push(b);
  }
  return entfernt;
}

function _aktualisiereAnzeige() {
  _verlauf();
  _fortschritt();
  _tastatur();
  _srStatus();
}

function _verlauf() {
  const liste = document.getElementById('ff-verlauf-liste');
  if (!liste) return;
  liste.innerHTML = '';
  // Placeholder nach erstem Versuch leeren (wie im Tageswort)
  const inp = document.getElementById('ff-wort-input');
  if (inp && ff.versuche.length > 0) inp.placeholder = '';

  ff.versuche.forEach((wort, idx) => {
    const erg = bewerteVersuch(wort, ff.zielwort);
    const li = document.createElement('li');
    li.className = 'verlauf-eintrag';
    let srText = `Versuch ${idx + 1}: ${wort}: `;
    let mini = '';
    erg.forEach((e, i) => {
      const cls = e === 'correct' ? 'correct' : e === 'present' ? 'present' : 'absent';
      const s = e === 'correct' ? 'richtig' : e === 'present' ? 'falsche Stelle' : 'nein';
      mini += `<span class="vb ${cls}" aria-hidden="true">${wort[i]}</span>`;
      srText += `${wort[i]}: ${s}, `;
    });
    li.innerHTML = `<span class="v-wort" aria-hidden="true">${wort}</span><span class="buchstaben" aria-hidden="true">${mini}</span><span class="sr-only">${srText}</span>`;
    liste.appendChild(li);
  });

  // Lösungsfortschritt wie im Hauptspiel
  const enthullt = Array(5).fill(false);
  ff.versuche.forEach(w =>
    bewerteVersuch(w, ff.zielwort).forEach((e, i) => { if (e === 'correct') enthullt[i] = true; })
  );
  const liL = document.createElement('li');
  liL.className = 'loesung-in-verlauf';
  let loesAria = 'Lösungsfortschritt: ';
  let loesHtml = '';
  for (let i = 0; i < 5; i++) {
    const z = enthullt[i] ? ff.zielwort[i] : '_';
    const cls = enthullt[i] ? '' : ' leer';
    loesHtml += `<span class="lz-zeichen${cls}" aria-hidden="true">${z}</span>`;
    loesAria += enthullt[i] ? ff.zielwort[i] + ' ' : '_ ';
  }
  // Verbleibende Versuche anzeigen (inkl. Fallenabzüge)
  const verfuegbar = ff.maxVersuche - ff.verloreneVersuche;
  const verbleibend = verfuegbar - ff.versuche.length;
  let restHtml = '';
  let restAria = '';
  if (!ff.spielende && verbleibend >= 0) {
    restHtml = `<span class="lz-rest" aria-hidden="true" style="font-size:.8rem;color:var(--text-muted);margin-left:8px;">noch ${verbleibend} ${verbleibend === 1 ? 'Versuch' : 'Versuche'}</span>`;
    restAria = ` Noch ${verbleibend} ${verbleibend === 1 ? 'Versuch' : 'Versuche'}.`;
  }
  liL.innerHTML = `<span class="sr-only">${loesAria}${restAria}</span>${loesHtml}${restHtml}`;
  liste.appendChild(liL);
}

function _fortschritt() {
  const verfuegbar = ff.maxVersuche - ff.verloreneVersuche;
  for (let i = 1; i <= 6; i++) {
    const p = document.getElementById(`ff-fp-${i}`);
    if (!p) continue;
    p.className = 'fp-punkt';
    if (i > verfuegbar) {
      // Durch Falle verlorener Versuch
      p.classList.add('verloren');
    } else if (i <= ff.versuche.length) {
      if (ff.spielende && ff.gewonnen && i === ff.versuche.length) p.classList.add('gewonnen');
      else if (ff.spielende && !ff.gewonnen) p.classList.add('verloren');
      else p.classList.add('aktiv');
    }
  }
}

function _tastatur() {
  const t = document.getElementById('ff-grafik-tastatur');
  if (!t) return;
  t.querySelectorAll('.taste[data-key]').forEach(taste => {
    const k = taste.dataset.key;
    if (!k || k === 'Enter' || k === 'Backspace') return;
    taste.dataset.status = ff.tastaturStatus[k] || '';
  });
}

function _srStatus() {
  const fallen = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'falle').join(' ') || 'keine';
  const nieten = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'niete').join(' ') || 'keine';
  const falsch = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'present').join(' ') || 'keine';
  const nein   = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'absent').join(' ') || 'keine';
  const used   = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'correct').join(' ') || 'keine';
  const unused = TASTATUR_BUCHSTABEN.filter(b => !ff.tastaturStatus[b]).join(' ') || 'keine';

  const s = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  s('ff-bz-falle',  `${fallen} (Fuchsfalle — war im Fallenwort, 1 Versuch verloren)`);
  s('ff-bz-niete',  `${nieten} (Niete — sicher, nicht im Fallenwort)`);
  s('ff-bz-falsch', `${falsch} (Falsche Stelle)`);
  s('ff-bz-nein',   `${nein} (Kommt nicht vor)`);
  s('ff-bz-used',   `${used} (Richtig, mehrfach vorkommen möglich)`);
  s('ff-bz-unused', `${unused} (Noch nicht verwendet)`);
}

async function _speichereStats() {
  const uid = appState.currentUser?.uid;
  if (uid) {
    try {
      const snap = await get(child(ref(db), `spieler/${uid}/fuchsfallen`));
      const s = snap.exists() ? snap.val() : { gespielt: 0, gewonnen: 0 };
      s.gespielt++;
      if (ff.gewonnen) s.gewonnen++;
      await set(ref(db, `spieler/${uid}/fuchsfallen`), s);
      return;
    } catch(e) { /* Fallback auf localStorage */ }
  }
  const raw = localStorage.getItem('ff_stats');
  const s = raw ? JSON.parse(raw) : { gespielt: 0, gewonnen: 0 };
  s.gespielt++;
  if (ff.gewonnen) s.gewonnen++;
  localStorage.setItem('ff_stats', JSON.stringify(s));
}

async function _zeigeErgebnis() {
  await _speichereStats();
  const bereich = document.getElementById('ff-ergebnis-bereich');
  if (!bereich) return;
  const v = ff.versuche.length;
  const vl = ff.verloreneVersuche;
  let html = ff.gewonnen
    ? `<p style="font-size:1.1rem;font-weight:700;color:#4a9e50;">Gewonnen!</p>
       <p>Das Zielwort war <strong>${ff.zielwort}</strong>. In ${v} ${v === 1 ? 'Versuch' : 'Versuchen'} erraten.</p>
       <p>Das Fallenwort war <strong>${ff.fallenwort}</strong>.</p>`
    : `<p style="font-size:1.1rem;font-weight:700;color:#c62828;">Verloren!</p>
       <p>Das Zielwort war <strong>${ff.zielwort}</strong>.</p>
       <p>Das Fallenwort war <strong>${ff.fallenwort}</strong>.</p>`;
  if (vl > 0) {
    html += `<p style="font-size:.9rem;color:var(--text-muted);">${vl} Versuch${vl !== 1 ? 'e' : ''} durch Fuchsfallen verloren.</p>`;
  }
  bereich.innerHTML = html;
  bereich.style.display = 'flex';
  setTimeout(() => { document.getElementById('btn-ff-neu')?.focus(); }, 100);
}

// FUCHSFALLEN ENDE
