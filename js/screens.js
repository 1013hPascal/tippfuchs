// Screen-Navigation: blendet Screens ein/aus

// SCREENS ANFANG
export function zeigeScreen(id) {
  document.querySelectorAll('main > section').forEach(s => {
    s.style.display = 'none'; s.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; el.classList.add('active'); }
}
function zeigeStart() { aktualisiereStartseite(); zeigeScreen('start-screen'); document.getElementById('fuchs-container').style.display = 'none'; }
// SCREENS ENDE
