// Screen-Navigation: blendet Screens ein/aus

// SCREENS ANFANG
export function zeigeScreen(id) {
  document.querySelectorAll('main > section').forEach(s => {
    s.style.display = 'none'; s.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; el.classList.add('active'); }

  // Globaler Zurück-Button oben: sichtbar auf allen Seiten außer Start
  const topZurueck = document.getElementById('global-top-zurueck');
  const topBtn = document.getElementById('btn-global-zurueck-top');
  if (topZurueck && topBtn) {
    if (id === 'start-screen') {
      topZurueck.style.display = 'none';
    } else {
      topZurueck.style.display = 'block';
      // Klickt den unteren Zurück-Button der aktiven Sektion
      topBtn.onclick = () => {
        const aktiv = document.getElementById(id);
        if (!aktiv) return;
        const zurueckBtn = aktiv.querySelector('[id^="btn-zurueck"]');
        if (zurueckBtn) zurueckBtn.click();
      };
    }
  }
}
function zeigeStart() { aktualisiereStartseite(); zeigeScreen('start-screen'); document.getElementById('fuchs-container').style.display = 'none'; }
// SCREENS ENDE
