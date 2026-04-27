import { LOESUNGSWOERTER } from './loesungswoerter.js';
import { EINGABEWOERTER } from './eingabewoerter.js';
import { bewerteVersuch } from './spiellogik.js';
import { zeigeScreen } from './screens.js';
import { sageLaut } from './live-region.js';

// FUCHSFALLEN ANFANG

const TASTATUR_BUCHSTABEN = [
  'Q','W','E','R','T','Z','U','I','O','P','Ü',
  'A','S','D','F','G','H','J','K','L','Ö','Ä',
  'Y','X','C','V','B','N','M','ẞ'
];

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
  ff.zielwort = w[i1].toUpperCase();
  ff.fallenwort = w[i2].toUpperCase();

  _aktualisiereAnzeige();
  const inp = document.getElementById('ff-wort-input');
  if (inp) { inp.value = ''; inp.focus(); }
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
  const vL = versuch.toLowerCase();
  if (!LOESUNGSWOERTER.includes(vL) && !EINGABEWOERTER.includes(vL)) {
    fehlerEl.textContent = 'Dieses Wort kennt der Fuchs nicht.';
    sageLaut('Dieses Wort kennt der Fuchs nicht.');
    return;
  }

  fehlerEl.textContent = '';
  inp.value = '';
  ff.versuche.push(versuch);

  const erg = bewerteVersuch(versuch, ff.zielwort);

  // Keyboard-Status für richtig/falsche Stelle aktualisieren
  erg.forEach((e, i) => {
    const b = versuch[i];
    const curr = ff.tastaturStatus[b];
    if (e === 'correct') ff.tastaturStatus[b] = 'correct';
    else if (e === 'present' && curr !== 'correct') ff.tastaturStatus[b] = 'present';
  });

  // Neue Buchstaben dieses Versuchs ermitteln (jeder Buchstabe nur einmal pro Spiel)
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
      // In beiden Wörtern: 1 Niete enthüllen
      nietenEntfernt.push(..._entferneNieten(1, b));
    } else if (inZ) {
      // Nur im Zielwort: 2 Nieten enthüllen
      nietenEntfernt.push(..._entferneNieten(2, b));
    } else if (inF) {
      // Nur im Fallenwort: Fuchsfalle!
      ff.fallen.add(b);
      ff.tastaturStatus[b] = 'falle';
      fallenBuchstaben.push(b);
    } else {
      // Weder noch: kein Spezialeffekt
      if (!ff.tastaturStatus[b]) ff.tastaturStatus[b] = 'absent';
    }
  }

  // absent für alle verbleibenden Buchstaben aus dem Wordle-Ergebnis setzen
  erg.forEach((e, i) => {
    const b = versuch[i];
    if (e === 'absent' &&
        ff.tastaturStatus[b] !== 'correct' &&
        ff.tastaturStatus[b] !== 'present' &&
        ff.tastaturStatus[b] !== 'falle') {
      ff.tastaturStatus[b] = 'absent';
    }
  });

  // Max. 1 Versuch verloren pro geratenem Wort
  if (fallenBuchstaben.length > 0) ff.verloreneVersuche += 1;

  // SR-Ankündigung zusammenbauen
  let sr = `Versuch ${ff.versuche.length}: `;
  erg.forEach((e, i) => {
    const s = e === 'correct' ? 'richtig' : e === 'present' ? 'falsche Stelle' : 'nicht im Wort';
    sr += `${versuch[i]} ${s}. `;
  });
  if (fallenBuchstaben.length > 0) {
    sr += `Fuchsfalle! ${fallenBuchstaben.join(', ')} ${fallenBuchstaben.length > 1 ? 'waren' : 'war'} im Fallenwort. 1 Versuch verloren. `;
  }
  if (nietenEntfernt.length > 0) {
    sr += `Nieten entfernt: ${nietenEntfernt.join(', ')}. `;
  }

  // Gewonnen/Verloren prüfen
  const verfuegbar = ff.maxVersuche - ff.verloreneVersuche;
  if (versuch === ff.zielwort) {
    ff.spielende = true;
    ff.gewonnen = true;
    sr += `Gewonnen! Das Zielwort war ${ff.zielwort}.`;
  } else if (ff.versuche.length >= verfuegbar) {
    ff.spielende = true;
    ff.gewonnen = false;
    sr += `Verloren! Das Zielwort war ${ff.zielwort}. Das Fallenwort war ${ff.fallenwort}.`;
  }

  sageLaut(sr);
  _aktualisiereAnzeige();

  if (ff.spielende) {
    _zeigeErgebnis();
  } else {
    inp.focus();
  }
}

function _entferneNieten(anzahl, ausschluss) {
  // Zufällige sichere Buchstaben enthüllen (nicht im Fallenwort, noch nicht gesehen)
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
  _tastatur();
  _info();
  _srStatus();
}

function _verlauf() {
  const liste = document.getElementById('ff-verlauf-liste');
  if (!liste) return;
  liste.innerHTML = '';
  ff.versuche.forEach(wort => {
    const erg = bewerteVersuch(wort, ff.zielwort);
    const li = document.createElement('li');
    li.className = 'verlauf-eintrag';
    let html = `<span class="v-wort" aria-hidden="true">${wort}</span><span class="buchstaben" aria-hidden="true">`;
    erg.forEach((e, i) => {
      html += `<span class="vb ${e}" aria-hidden="true">${wort[i]}</span>`;
    });
    html += '</span>';
    li.innerHTML = html;
    liste.appendChild(li);
  });
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

function _info() {
  const verfuegbar = ff.maxVersuche - ff.verloreneVersuche;
  const verbleibend = Math.max(0, verfuegbar - ff.versuche.length);
  const el = document.getElementById('ff-versuche-info');
  if (!el) return;
  let txt = `${verbleibend} Versuch${verbleibend !== 1 ? 'e' : ''} verbleibend`;
  if (ff.verloreneVersuche > 0) {
    txt += ` (${ff.verloreneVersuche} durch Fallen verloren)`;
  }
  el.textContent = txt;
}

function _srStatus() {
  const fallen  = [...ff.fallen].join(' ') || 'keine';
  const nieten  = [...ff.nieten].join(' ') || 'keine';
  const richtig = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'correct').join(' ') || 'keine';
  const falsch  = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'present').join(' ') || 'keine';
  const absent  = TASTATUR_BUCHSTABEN.filter(b => ff.tastaturStatus[b] === 'absent').join(' ') || 'keine';
  const unused  = TASTATUR_BUCHSTABEN.filter(b => !ff.tastaturStatus[b]).join(' ') || 'keine';

  const s = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  s('ff-bz-falle',  `${fallen} (Fuchsfalle — war im Fallenwort, 1 Versuch verloren)`);
  s('ff-bz-niete',  `${nieten} (Niete — sicher, nicht im Fallenwort)`);
  s('ff-bz-richtig',`${richtig} (Richtige Stelle im Zielwort)`);
  s('ff-bz-falsch', `${falsch} (Falsche Stelle im Zielwort)`);
  s('ff-bz-nein',   `${absent} (Nicht im Zielwort)`);
  s('ff-bz-unused', `${unused} (Noch nicht verwendet)`);
}

function _speichereStats() {
  const raw = localStorage.getItem('ff_stats');
  const s = raw ? JSON.parse(raw) : { gespielt: 0, gewonnen: 0 };
  s.gespielt++;
  if (ff.gewonnen) s.gewonnen++;
  localStorage.setItem('ff_stats', JSON.stringify(s));
}

export function ladeFFStats() {
  const raw = localStorage.getItem('ff_stats');
  return raw ? JSON.parse(raw) : { gespielt: 0, gewonnen: 0 };
}

function _zeigeErgebnis() {
  _speichereStats();
  const bereich = document.getElementById('ff-ergebnis-bereich');
  if (!bereich) return;
  const v = ff.versuche.length;
  const vl = ff.verloreneVersuche;
  let html = ff.gewonnen
    ? `<p style="font-size:1.1rem;font-weight:700;color:#4a9e50;">Gewonnen!</p>
       <p>Das Zielwort war <strong>${ff.zielwort}</strong>. In ${v} ${v === 1 ? 'Versuch' : 'Versuchen'} erraten.</p>`
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
