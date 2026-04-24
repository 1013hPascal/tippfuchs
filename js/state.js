// Gemeinsamer App-Zustand — von allen Modulen importiert
export const appState = {
  currentUser: null,
  currentSpitzname: null,
  aktiveGruppeId: null,
  aktiveGruppeDaten: null,
  gruppenVerlassenAuswahl: null,
  timerInterval: null,
  TAGESWORT: null,
  pendingBeitreten: null,
  pendingDuell: null,
  duellModus: null,
};

// Spielzustand — als Objekt direkt mutierbar nach Import
export const state = {
  versuche: [], spielende: false, gewonnen: false,
  startZeit: null, endZeit: null, ersterVersuchGemacht: false
};
