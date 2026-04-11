import { appState, state } from './state.js';

// TIMER ANFANG
export function starteTimer() {
  clearInterval(appState.timerInterval);
  appState.timerInterval = setInterval(() => {
    if (!state.startZeit||state.endZeit) return;
    const sek = Math.floor((Date.now()-state.startZeit)/1000);
    document.getElementById('timer-wert').textContent = formatZeit(sek);
    aktualisiereUhrZeiger(sek);
  }, 1000);
}
export function stoppeTimer() { clearInterval(appState.timerInterval); state.endZeit = Date.now(); }
export function formatZeit(sek) {
  return `${String(Math.floor(sek/60)).padStart(2,'0')}:${String(sek%60).padStart(2,'0')}`;
}
export function getGesamtZeit() {
  if (!state.startZeit||!state.endZeit) return '-';
  return formatZeit(Math.floor((state.endZeit-state.startZeit)/1000));
}
// TIMER ENDE
