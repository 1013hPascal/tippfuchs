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
    'erfolge':    {x: 124, y: 193},
    'statistik':  {x: 206, y: 193},
    'gruppen':    {x: 288, y: 193},
    'anmelden':   {x: 360, y: 193},
    'design':     {x: 432, y: 193},
    'anleitung':  {x: 508, y: 193},
    'philosophie':{x: 358, y: 345},
    'quellen':    {x: 307, y: 325},
  };

  function oeffneFenster(name) {
    // Alle Panels verstecken
    ['erfolge','statistik','gruppen','anmelden','design','anleitung','philosophie','quellen'].forEach(n => {
      const p = document.getElementById(`haus-panel-${n}`);
      if (p) p.style.display = 'none';
    });
    // Gewähltes Panel zeigen
    const panel = document.getElementById(`haus-panel-${name}`);
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

  // Pool-Klick → Spielen
  const poolKlick = document.getElementById('pool-klick');
  const poolText = document.getElementById('pool-btn-text');
  const poolSub = document.getElementById('pool-btn-subtext');

  function aktualisierePoolText() {
    if (poolText) {
      // Text vom zugänglichen Button spiegeln
      const btnSpielStarten = document.getElementById('btn-spiel-starten');
      const btnText = btnSpielStarten ? btnSpielStarten.textContent.trim() : '';
      if (btnText && btnText !== '🦊 Wird geladen...') {
        poolText.textContent = btnText;
        // Schriftgröße bei längeren Texten verkleinern
        const groesse = btnText.length > 18 ? '9' : btnText.length > 13 ? '10' : '11';
        poolText.setAttribute('font-size', groesse);
      } else {
        poolText.textContent = appState.currentUser && appState.currentSpitzname ? '🦊 Jetzt spielen' : '🦊 Jetzt anmelden';
        poolText.setAttribute('font-size', '11');
      }
    }
    if (poolSub) {
      poolSub.textContent = appState.currentUser && appState.currentSpitzname
        ? 'Tippe zum Starten'
        : 'Tippe zum Anmelden';
    }
  }
  aktualisierePoolText();

  if (poolKlick) {
    poolKlick.addEventListener('click', () => {
      if (appState.currentUser && appState.currentSpitzname) {
        starteSpiel();
      } else {
        oeffneFenster('anmelden');
      }
    });
  }
  // Auch Textklick
  if (poolText) poolText.addEventListener('click', () => poolKlick && poolKlick.dispatchEvent(new Event('click')));
  if (poolSub) poolSub.addEventListener('click', () => poolKlick && poolKlick.dispatchEvent(new Event('click')));

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
