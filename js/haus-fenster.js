import { appState } from './state.js';
import { aktualisiereStartStats } from './lokaler-zustand.js';
import { formatZeit } from './timer.js';

// HAUS-FENSTER NAVIGATION ANFANG
export function initialisiereHausFenster() {
  const fensterGruppen = document.querySelectorAll('.haus-fenster');
  const menueFeld = document.getElementById('haus-menue-feld');
  const tatzeMarker = document.getElementById('tatze-marker');
  let aktivFenster = null;

  // Fenster-Positionen für Tatze (x,y im SVG-Koordinatensystem)
  const fensterPositionen = {
    'design':      {x: 145, y: 146},
    'anleitung':   {x: 495, y: 146},
    'erfolge':     {x: 140, y: 199},
    'gruppen':     {x: 320, y: 199},
    'statistik':   {x: 500, y: 199},
    'anmelden':    {x: 130, y: 249},
    'spielprinzip':{x: 390, y: 252},
    'philosophie': {x: 160, y: 332},
    'quellen':     {x: 488, y: 333},
  };

  function oeffneFenster(name) {
    // Alle Panels verstecken
    ['erfolge','statistik','gruppen','anmelden','design','anleitung','philosophie','quellen'].forEach(n => {
      const p = document.getElementById(`haus-panel-${n}`);
      if (p) p.style.display = 'none';
    });
    // spielprinzip zeigt das anleitung-Panel
    const panelName = name === 'spielprinzip' ? 'anleitung' : name;
    // Gewähltes Panel zeigen
    const panel = document.getElementById(`haus-panel-${panelName}`);
    if (panel) panel.style.display = 'block';
    // Menüfeld zeigen
    if (menueFeld) menueFeld.style.display = 'block';
    // Tatze positionieren
    if (tatzeMarker && fensterPositionen[name]) {
      const pos = fensterPositionen[name];
      tatzeMarker.setAttribute('transform', `translate(${pos.x},${pos.y})`);
      tatzeMarker.setAttribute('opacity', '1');
    }
    // Erfolge: Daten aktualisieren
    if (name === 'erfolge') aktualisiereHausErfolge();
    // Design: Animationsbutton aktualisieren
    if (name === 'design') {
      const animBtn = document.getElementById('haus-btn-anim');
      if (animBtn) animBtn.textContent = document.body.classList.contains('keine-animationen') ? '🔇 Anim aus' : '✨ Anim an';
    }
    aktivFenster = name;
  }

  function schliesseFenster() {
    if (menueFeld) menueFeld.style.display = 'none';
    if (tatzeMarker) tatzeMarker.setAttribute('opacity', '0');
    aktivFenster = null;
  }

  // Fenster-Klicks
  fensterGruppen.forEach(g => {
    g.addEventListener('click', () => {
      const name = g.dataset.fenster;
      if (name === 'spielen') {
        const btnSpielStarten = document.getElementById('btn-spiel-starten');
        if (btnSpielStarten) btnSpielStarten.click();
        return;
      }
      if (aktivFenster === name) {
        schliesseFenster();
      } else {
        oeffneFenster(name);
      }
    });
    // Tastatur zugänglich machen
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '-1'); // -1 weil aria-hidden auf parent
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        g.click();
      }
    });
  });

  // Schließen-Button
  const schliessenBtn = document.getElementById('haus-menue-schliessen');
  if (schliessenBtn) schliessenBtn.addEventListener('click', schliesseFenster);

  // Pool-Text aktualisieren
  const poolText = document.getElementById('pool-btn-text');
  const poolSub = document.getElementById('pool-btn-subtext');

  function aktualisierePoolText() {
    if (poolText) {
      const btnSpielStarten = document.getElementById('btn-spiel-starten');
      const modus = btnSpielStarten ? btnSpielStarten.dataset.modus : '';
      if (modus === 'duelle') {
        poolText.textContent = '⚔️ Duelle starten';
        poolText.setAttribute('font-size', '13');
      } else if (appState.currentUser && appState.currentSpitzname) {
        poolText.textContent = '🦊 Jetzt spielen';
        poolText.setAttribute('font-size', '14');
      } else {
        poolText.textContent = '🦊 Jetzt anmelden';
        poolText.setAttribute('font-size', '14');
      }
    }
    if (poolSub) {
      poolSub.textContent = appState.currentUser && appState.currentSpitzname
        ? 'Tippe zum Starten'
        : 'Tippe zum Anmelden';
    }
  }
  aktualisierePoolText();

  // Pool-Text aktualisieren wenn Login-Status sich ändert
  window.aktualisiereHausPoolText = aktualisierePoolText;
}

export function aktualisiereHausErfolge() {
  const streakEl = document.getElementById('haus-streak-anzeige');
  const rekordEl = document.getElementById('haus-rekord-anzeige');
  const streakSrc = document.getElementById('start-streak');
  const rekordSrc = document.getElementById('start-rekord');
  if (streakEl && streakSrc) streakEl.textContent = streakSrc.textContent;
  if (rekordEl && rekordSrc) rekordEl.textContent = rekordSrc.textContent;
}
// HAUS-FENSTER NAVIGATION ENDE
