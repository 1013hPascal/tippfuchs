import { appState, state } from './state.js';
import { TAGES_IDX } from './tageswort.js';
import { ladeSpitzname, spitznameVorhanden, speichereSpitzname, aendereSpitzname } from './firebase-basis.js';
import { zeigeScreen } from './screens.js';
import { zeigeStart, aktualisiereStartseite, googleLogin, abmelden, loescheAccount } from './auth.js';
import { starteSpiel, verarbeiteWort, zeigeErgebnis, bewerteVersuch, starteDuellSpiel } from './spiellogik.js';
import { zeigeTagesrangliste } from './rangliste.js';
import { ladeBotListe, ladeTagsSelect, ladeMonatSelect, ladeJahrSelect } from './statistik.js';
import { zeigeGruppenScreen, zeigeGruppeVerlassenModal, ladeMeineGruppenListe, zeigeGruppeDetail, stoppeGruppenRefresh } from './gruppen-ui.js';
import { erstelleGruppe, ladeGruppe, sendeAnfrage, verlasseGruppe } from './gruppen.js';
import { teile, teileRangliste } from './teilen.js';
import { oeffneModal, schliesseModal, schliesseAlleModals } from './modal.js';
import { setzeDark } from './design.js';
import { sageLaut } from './live-region.js';
import { registrierePushButtons, speichereOnboardingErinnerung } from './push-benachrichtigungen.js';
import { erstelleDuell, zufallsWort, teileDuell, zeigeMeineDuelleInhalt, speicherePendingId, ladeDuell, speichereEmojiReaktion, zeigeStartDuelleStats } from './duelle.js';

// EVENT-LISTENER ANFANG
// Haupt-Spielen-Button oben
document.getElementById('btn-spiel-starten').addEventListener('click', () => {
  if (appState.currentUser && appState.currentSpitzname) {
    // Gespielt → Fuchs-Duelle, sonst normales Spiel
    if (document.getElementById('btn-spiel-starten').dataset.modus === 'duelle') {
      zeigeScreen('fuchs-duelle-screen');
      zeigeMeineDuelleInhalt();
      return;
    }
    starteSpiel();
  } else {
    // Nicht angemeldet → Account-Bereich aufklappen und Fokus auf erstes Element
    const accountInhalt = document.getElementById('account-inhalt');
    const accountToggle = document.getElementById('btn-account-toggle');
    if (accountInhalt && accountInhalt.style.display === 'none') {
      accountInhalt.style.display = 'flex';
      if (accountToggle) accountToggle.setAttribute('aria-expanded', 'true');
    }
    sageLaut('Bitte melde dich an um zu spielen.');
    setTimeout(() => {
      const erstesElement = document.getElementById('btn-mit-email');
      if (erstesElement) { erstesElement.scrollIntoView({behavior: 'smooth', block: 'center'}); erstesElement.focus(); }
    }, 50);
  }
});

document.getElementById('btn-ohne-konto').addEventListener('click', () => {
  starteSpiel();
});

document.getElementById('btn-mit-konto').addEventListener('click', async()=>{
  if (appState.currentUser&&appState.currentSpitzname) { starteSpiel(); return; }
  const user=await googleLogin();
  if (!user) { sageLaut('Anmeldung fehlgeschlagen.'); return; }
  appState.currentUser=user;
  const name=await ladeSpitzname(user.uid);
  appState.currentSpitzname=name; aktualisiereStartseite();
  if (!name) { zeigeScreen('spitzname-screen'); setTimeout(()=>document.getElementById('spitzname-input').focus(),100); }
  else { aktualisiereStartseite(); setTimeout(()=>document.getElementById('btn-spiel-starten').focus(),100); }
});
document.getElementById('btn-abmelden').addEventListener('click', abmelden);
document.getElementById('btn-account-loeschen').addEventListener('click', async () => {
  if (!confirm('Moechtest du deinen Account wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.')) return;
  await loescheAccount();
});
document.getElementById('btn-stats-start').addEventListener('click',async()=>{ zeigeScreen('alle-stats-screen'); await ladeBotListe(); await ladeTagsSelect(); await ladeMonatSelect(); await ladeJahrSelect(); });
document.getElementById('btn-gruppen-start').addEventListener('click',zeigeGruppenScreen);

document.getElementById('btn-spitzname-aendern-start').addEventListener('click',()=>{ document.getElementById('neuer-spitzname-bereich').style.display='none'; document.getElementById('neuer-spitzname-fehler').textContent=''; document.getElementById('neuer-spitzname-input').value=''; oeffneModal('modal-spitzname'); });
document.getElementById('btn-spitzname-bestaetigen').addEventListener('click',async()=>{
  const input=document.getElementById('spitzname-input');
  const fehler=document.getElementById('spitzname-fehler');
  const name=input.value.trim();
  if (name.length<2) { fehler.textContent='Spielername muss mindestens 2 Zeichen haben.'; return; }
  const v=await spitznameVorhanden(name);
  if (v) { fehler.textContent='Spielername gibt es schon, waehle einen anderen.'; sageLaut('Spielername gibt es schon.'); input.value=''; input.focus(); return; }
  await speichereSpitzname(appState.currentUser.uid,name);
  appState.currentSpitzname=name; fehler.textContent=''; aktualisiereStartseite();
  if (appState.pendingBeitreten) {
    const code=appState.pendingBeitreten; appState.pendingBeitreten=null;
    await zeigeGruppenScreen();
    document.getElementById('gruppe-id-input').value=code;
    document.getElementById('gruppe-beitreten-fehler').textContent='';
    oeffneModal('modal-gruppe-beitreten');
    setTimeout(()=>document.getElementById('gruppe-id-input').focus(),150);
    sageLaut('Du wurdest zu einer Gruppe eingeladen. Klicke auf Anfrage senden um beizutreten.');
  } else { zeigeScreen('push-onboarding-screen'); setTimeout(()=>document.getElementById('btn-onb-push-speichern').focus(),100); }
});
document.getElementById('spitzname-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); document.getElementById('btn-spitzname-bestaetigen').click(); } });
document.getElementById('btn-google-spitzname').addEventListener('click',async()=>{
  const user=await googleLogin(); if (!user) return;
  appState.currentUser=user; const alterName=await ladeSpitzname(user.uid); appState.currentSpitzname=alterName;
  document.getElementById('neuer-spitzname-bereich').style.display='flex';
  setTimeout(()=>document.getElementById('neuer-spitzname-input').focus(),100);
});
document.getElementById('btn-neuer-spitzname-bestaetigen').addEventListener('click',async()=>{
  const input=document.getElementById('neuer-spitzname-input');
  const fehler=document.getElementById('neuer-spitzname-fehler');
  const neuerName=input.value.trim();
  if (neuerName.length<2) { fehler.textContent='Spielername muss mindestens 2 Zeichen haben.'; return; }
  const v=await spitznameVorhanden(neuerName);
  if (v) { fehler.textContent='Spielername gibt es schon, waehle einen anderen.'; input.value=''; input.focus(); return; }
  await aendereSpitzname(appState.currentUser.uid,appState.currentSpitzname,neuerName);
  appState.currentSpitzname=neuerName; fehler.textContent=''; aktualisiereStartseite();
  sageLaut('Spielername erfolgreich geaendert.'); schliesseModal('modal-spitzname');
});
document.getElementById('neuer-spitzname-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); document.getElementById('btn-neuer-spitzname-bestaetigen').click(); } });
let _vorherigeInputLaenge = 0;
document.getElementById('wort-input').addEventListener('input', function() {
  const vorher = _vorherigeInputLaenge;
  this.value = this.value.toUpperCase().replace(/[^A-ZÄÖÜẞ]/g,'').slice(0,5);
  _vorherigeInputLaenge = this.value.length;
  if (this.value.length > vorher && this.value.length > 0) {
    _pruefeEingabeHinweis(this.value[this.value.length - 1], this.value.length - 1);
  }
});

function _pruefeEingabeHinweis(buchstabe, position) {
  if (!state.versuche || state.versuche.length === 0 || !appState.TAGESWORT) return;
  const absentSet = new Set();
  const correctSet = new Set();
  const correctAnPos = Array(5).fill(null);
  state.versuche.forEach(versuch => {
    bewerteVersuch(versuch, appState.TAGESWORT).forEach((e, i) => {
      if (e === 'correct') { correctSet.add(versuch[i]); correctAnPos[i] = versuch[i]; }
      else if (e === 'absent') absentSet.add(versuch[i]);
    });
  });
  if (absentSet.has(buchstabe) && !correctSet.has(buchstabe)) {
    sageLaut(`Buchstabe ${buchstabe} darf nicht im Wort vorkommen.`);
  } else if (correctAnPos[position] && correctAnPos[position] !== buchstabe) {
    sageLaut(`An der Stelle hast du ${correctAnPos[position]} schon richtig.`);
  }
}
document.getElementById('wort-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); _vorherigeInputLaenge=0; verarbeiteWort(); } if (e.key==='Escape') { this.value=''; _vorherigeInputLaenge=0; this.blur(); sageLaut('Eingabe abgebrochen.'); } });

// Grafische QWERTZ-Tastatur
document.getElementById('grafik-tastatur')?.addEventListener('click', e => {
  const taste = e.target.closest('.taste[data-key]');
  if (!taste) return;
  const key = taste.dataset.key;
  const input = document.getElementById('wort-input');
  if (key === 'Backspace') {
    input.value = input.value.slice(0, -1);
    _vorherigeInputLaenge = input.value.length;
  } else if (key === 'Enter') {
    _vorherigeInputLaenge = 0;
    verarbeiteWort();
  } else {
    if (input.value.length < 5) {
      const pos = input.value.length;
      input.value += key;
      _vorherigeInputLaenge = input.value.length;
      _pruefeEingabeHinweis(key, pos);
    }
  }
  input.focus();
});




document.getElementById('btn-zurueck-von-rangliste').addEventListener('click',()=>{ if (state.spielende) zeigeErgebnis(state.gewonnen); else zeigeStart(); });
document.getElementById('btn-alle-spieler-stats').addEventListener('click',async()=>{ zeigeScreen('alle-stats-screen'); await ladeBotListe(); await ladeTagsSelect(); await ladeMonatSelect(); await ladeJahrSelect(); });
document.getElementById('btn-gruppen-stats').addEventListener('click',zeigeGruppenScreen);
document.getElementById('btn-zurueck-von-statistik').addEventListener('click',zeigeStart);
document.getElementById('btn-zurueck-von-alle').addEventListener('click', zeigeStart);
document.getElementById('btn-gruppen-login').addEventListener('click',async()=>{ const user=await googleLogin(); if (!user) return; appState.currentUser=user; appState.currentSpitzname=await ladeSpitzname(user.uid); aktualisiereStartseite(); zeigeGruppenScreen(); });
document.getElementById('btn-gruppe-erstellen-oeffnen').addEventListener('click',()=>{ document.getElementById('gruppe-name-input').value=''; document.getElementById('gruppe-erstellen-fehler').textContent=''; oeffneModal('modal-gruppe-erstellen'); setTimeout(()=>document.getElementById('gruppe-name-input').focus(),100); });
document.getElementById('btn-gruppe-beitreten-oeffnen').addEventListener('click',()=>{ document.getElementById('gruppe-id-input').value=''; document.getElementById('gruppe-beitreten-fehler').textContent=''; oeffneModal('modal-gruppe-beitreten'); setTimeout(()=>document.getElementById('gruppe-id-input').focus(),100); });
document.getElementById('btn-gruppe-verlassen-oeffnen').addEventListener('click',zeigeGruppeVerlassenModal);
document.getElementById('btn-gruppe-erstellen-bestaetigen').addEventListener('click',async()=>{
  const input=document.getElementById('gruppe-name-input');
  const fehler=document.getElementById('gruppe-erstellen-fehler');
  const name=input.value.trim();
  if (name.length<2) { fehler.textContent='Gruppenname muss mindestens 2 Zeichen haben.'; return; }
  if (!appState.currentUser||!appState.currentSpitzname) { fehler.textContent='Du musst angemeldet sein.'; return; }
  const id=await erstelleGruppe(name);
  if (!id) { fehler.textContent='Fehler beim Erstellen.'; return; }
  sageLaut(`Gruppe ${name} erstellt.`);
  schliesseModal('modal-gruppe-erstellen');
  await ladeMeineGruppenListe();
  zeigeGruppeDetail(id);
});
document.getElementById('gruppe-name-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); document.getElementById('btn-gruppe-erstellen-bestaetigen').click(); } });
document.getElementById('btn-gruppe-anfrage-senden').addEventListener('click',async()=>{
  const input=document.getElementById('gruppe-id-input');
  const fehler=document.getElementById('gruppe-beitreten-fehler');
  const id=input.value.trim().toUpperCase();
  if (id.length<6) { fehler.textContent='Bitte einen gueltigen Beitrittsschluessel eingeben.'; return; }
  if (!appState.currentUser||!appState.currentSpitzname) { fehler.textContent='Du musst angemeldet sein.'; return; }
  const erg=await sendeAnfrage(id);
  if (erg===false) fehler.textContent='Gruppe nicht gefunden.';
  else if (erg==='bereits') fehler.textContent='Du bist bereits Mitglied.';
  else if (erg==='ausstehend') fehler.textContent='Du hast bereits eine Anfrage gesendet.';
  else { sageLaut('Anfrage gesendet.'); schliesseModal('modal-gruppe-beitreten'); await zeigeGruppenScreen(); }
});
document.getElementById('gruppe-id-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); document.getElementById('btn-gruppe-anfrage-senden').click(); } });
document.getElementById('btn-gruppe-verlassen-bestaetigen').addEventListener('click',async()=>{
  if (!appState.gruppenVerlassenAuswahl) return;
  const g=appState.gruppenVerlassenAuswahl;
  await verlasseGruppe(g.id);
  sageLaut(`Gruppe "${g.name}" verlassen.`);
  schliesseModal('modal-gruppe-verlassen');
  await ladeMeineGruppenListe();
});
document.getElementById('btn-zurueck-von-gruppen').addEventListener('click', () => { stoppeGruppenRefresh(); zeigeStart(); });
document.getElementById('btn-zurueck-von-gruppe-detail').addEventListener('click', zeigeGruppenScreen);
document.getElementById('spitzname-modal-close').addEventListener('click',()=>schliesseModal('modal-spitzname'));
document.getElementById('gruppe-erstellen-close').addEventListener('click',()=>schliesseModal('modal-gruppe-erstellen'));
document.getElementById('gruppe-beitreten-close').addEventListener('click',()=>schliesseModal('modal-gruppe-beitreten'));
document.getElementById('gruppe-verlassen-close').addEventListener('click',()=>schliesseModal('modal-gruppe-verlassen'));
document.getElementById('btn-theme').addEventListener('click',()=>setzeDark(document.documentElement.dataset.theme!=='dark'));
document.addEventListener('keydown',e=>{ if (e.key==='Escape') schliesseAlleModals(); });
document.querySelectorAll('.modal-overlay').forEach(o=>{ o.addEventListener('click',e=>{ if (e.target===o) schliesseModal(o.id); }); });
document.getElementById('bot-suche').addEventListener('input',function(){ clearTimeout(suchTimeout); suchTimeout=setTimeout(()=>ladeBotListe(this.value.trim()),400); });
document.getElementById('btn-zurueck-zum-menue').addEventListener('click', () => {
  if (appState.duellModus) { appState.duellModus = null; zeigeScreen('fuchs-duelle-screen'); zeigeMeineDuelleInhalt(); } else { zeigeStart(); }
});
document.getElementById('btn-zurueck-erg').addEventListener('click', () => {
  if (appState.duellModus) { appState.duellModus = null; zeigeScreen('fuchs-duelle-screen'); zeigeMeineDuelleInhalt(); } else { zeigeStart(); }
});
document.getElementById('btn-duelle-spielen-erg').addEventListener('click', () => {
  zeigeScreen('fuchs-duelle-screen'); zeigeMeineDuelleInhalt();
});

document.getElementById('btn-zurueck-zu-duelle').addEventListener('click', () => {
  appState.duellModus = null; zeigeScreen('fuchs-duelle-screen'); zeigeMeineDuelleInhalt();
});
document.getElementById('btn-spielanleitung').addEventListener('click', () => {
  const btn = document.getElementById('btn-anleitung-toggle');
  const inhalt = document.getElementById('anleitung-toggle-inhalt');
  if (btn && inhalt && btn.getAttribute('aria-expanded') !== 'true') {
    btn.click();
  }
  setTimeout(() => {
    const section = document.getElementById('anleitung-toggle-inhalt');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
});

// Ausklappbare Bereiche — gemeinsame Hilfsfunktion
function registriereToggle(btnId, inhaltId, label) {
  const btn = document.getElementById(btnId);
  const inhalt = document.getElementById(inhaltId);
  if (!btn || !inhalt) return;
  btn.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    inhalt.style.display = expanded ? 'none' : 'flex';
    sageLaut(expanded ? label + ' eingeklappt.' : label + ' ausgeklappt.');
    // Aufgeklappt: Fokus auf erstes Kind-Element setzen
    if (!expanded) {
      const erstesKind = inhalt.firstElementChild;
      if (erstesKind) {
        const fokussierbar = ['BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(erstesKind.tagName);
        if (!fokussierbar && !erstesKind.hasAttribute('tabindex')) erstesKind.setAttribute('tabindex', '-1');
        setTimeout(() => erstesKind.focus(), 50);
      }
    }
  });
}

registriereToggle('btn-erg-wortbedeutung', 'erg-wortbedeutung-inhalt', 'Wortbedeutung');
registriereToggle('btn-push-toggle',      'push-inhalt',             'Benachrichtigungen einstellen');
registriereToggle('btn-kalender-toggle',  'kalender-inhalt',         'Tägliche Erinnerung');
registrierePushButtons();

// Push-Onboarding-Screen Buttons
document.getElementById('btn-onb-push-speichern').addEventListener('click', async () => {
  await speichereOnboardingErinnerung();
  zeigeScreen('start-screen');
  sageLaut('Einstellungen gespeichert. Willkommen bei Tippfuchs!');
});
document.getElementById('btn-onb-push-nein').addEventListener('click', () => {
  zeigeScreen('start-screen');
  sageLaut('Willkommen bei Tippfuchs!');
});

registriereToggle('btn-erfolge-toggle',   'erfolge-inhalt',          'Persönliche Erfolge');
registriereToggle('btn-tagesergebnis-toggle', 'tagesergebnis-inhalt', 'Tagesergebnis ansehen');

document.getElementById('btn-duelle-stats-toggle')?.addEventListener('click', async () => {
  const toggle = document.getElementById('btn-duelle-stats-toggle');
  const inhalt = document.getElementById('duelle-stats-inhalt');
  const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  inhalt.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) {
    if (appState.currentUser) {
      await zeigeStartDuelleStats(appState.currentUser.uid);
    } else {
      inhalt.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted);">Bitte melde dich an um deine Duelle-Statistik zu sehen.</span>';
    }
  }
});

registriereToggle('btn-gruppen-toggle',   'start-gruppen-inhalt',    'Meine Tippfuchsgruppen');
registriereToggle('btn-stats-toggle',     'stats-inhalt',            'Statistik aller Tippfüchse');
registriereToggle('btn-account-toggle',   'account-inhalt',          'Account');
registriereToggle('btn-design-toggle',    'design-inhalt',           'Design auswaehlen');
registriereToggle('btn-anleitung-toggle',         'anleitung-toggle-inhalt',  'Anleitung und Hilfe');
registriereToggle('btn-philosophie-toggle',       'philosophie-inhalt',       'Philosophie');
registriereToggle('btn-lizenzen-toggle',          'lizenzen-inhalt',          'Quellen und Lizenzen');
registriereToggle('btn-gruppen-verwalten-toggle', 'gruppen-verwalten-inhalt', 'Tippfuchsgruppen verwalten');
registriereToggle('btn-freunde-verwalten-toggle', 'freunde-verwalten-inhalt', 'Freundesliste verwalten');

// Fuchs-Duelle Screen
document.getElementById('btn-zurueck-von-duelle').addEventListener('click', () => zeigeScreen('start-screen'));

registriereToggle('btn-meine-duelle-toggle',  'meine-duelle-inhalt',  'Meine Duelle');
registriereToggle('btn-vergiftetes-toggle',   'vergiftetes-inhalt',   'Das vergiftete Wort');
registriereToggle('btn-fuchsjagd-toggle',     'fuchsjagd-inhalt',     'Fuchsjagd');
registriereToggle('btn-wortfuchs-toggle',     'wortfuchs-inhalt',     'Wortfuchs');

// Meine Duelle laden wenn aufgeklappt
document.getElementById('btn-meine-duelle-toggle').addEventListener('click', () => {
  if (document.getElementById('btn-meine-duelle-toggle').getAttribute('aria-expanded') === 'true') {
    zeigeMeineDuelleInhalt();
  }
}, true);

// Meine-Duelle-Akkordion öffnen und Formular schließen
function wechselZuMeineDuelle(formToggleId, formInhaltId) {
  document.getElementById('btn-meine-duelle-toggle').setAttribute('aria-expanded', 'true');
  document.getElementById('meine-duelle-inhalt').style.display = 'flex';
  document.getElementById(formToggleId).setAttribute('aria-expanded', 'false');
  document.getElementById(formInhaltId).style.display = 'none';
  zeigeMeineDuelleInhalt();
}

// Wortfuchs
document.getElementById('btn-wortfuchs-speichern').addEventListener('click', async () => {
  const input = document.getElementById('wortfuchs-eingabe');
  const fehler = document.getElementById('wortfuchs-fehler');
  const wort = input.value.trim().toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');
  if (wort.length !== 5) { fehler.textContent = 'Bitte genau 5 Buchstaben eingeben.'; return; }
  fehler.textContent = '';
  const btn = document.getElementById('btn-wortfuchs-speichern');
  btn.disabled = true; btn.textContent = 'Wird gespeichert…';
  try {
    await erstelleDuell('wortfuchs', wort);
    input.value = '';
    sageLaut('Wortfuchs gespeichert. Den Link findest du unter Gestellte Duelle.');
    wechselZuMeineDuelle('btn-wortfuchs-toggle', 'wortfuchs-inhalt');
  } catch(e) { fehler.textContent = 'Fehler beim Erstellen. Bitte versuche es erneut.'; }
  btn.disabled = false; btn.textContent = 'Spiel speichern ⚔️';
});

// Vergiftetes Wort
document.getElementById('btn-vergiftetes-speichern').addEventListener('click', async () => {
  const loesEl = document.getElementById('vergiftetes-loesung');
  const verhEl = document.getElementById('vergiftetes-verhext');
  const fehler = document.getElementById('vergiftetes-fehler');
  const loes = loesEl.value.trim().toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');
  const verh = verhEl.value.trim().toUpperCase().replace(/[^A-ZÄÖÜ]/g, '');
  if (loes.length !== 5) { fehler.textContent = 'Lösungswort muss genau 5 Buchstaben haben.'; return; }
  if (verh.length !== 5) { fehler.textContent = 'Verhextes Wort muss genau 5 Buchstaben haben.'; return; }
  if (loes === verh) { fehler.textContent = 'Lösungswort und verhextes Wort dürfen nicht identisch sein.'; return; }
  fehler.textContent = '';
  const btn = document.getElementById('btn-vergiftetes-speichern');
  btn.disabled = true; btn.textContent = 'Wird gespeichert…';
  try {
    await erstelleDuell('vergiftetes_wort', loes, verh);
    loesEl.value = ''; verhEl.value = '';
    sageLaut('Verhextes Wort gespeichert. Den Link findest du unter Gestellte Duelle.');
    wechselZuMeineDuelle('btn-vergiftetes-toggle', 'vergiftetes-inhalt');
  } catch(e) { fehler.textContent = 'Fehler beim Erstellen. Bitte versuche es erneut.'; }
  btn.disabled = false; btn.textContent = 'Spiel speichern ⚔️';
});

// Fuchsjagd
document.getElementById('btn-fuchsjagd-speichern').addEventListener('click', async () => {
  const fehler = document.getElementById('fuchsjagd-fehler');
  fehler.textContent = '';
  const btn = document.getElementById('btn-fuchsjagd-speichern');
  btn.disabled = true; btn.textContent = 'Wird gespeichert…';
  try {
    const id = await erstelleDuell('fuchsjagd', zufallsWort());
    speicherePendingId(id);
    sageLaut('Fuchsrennen gespeichert. Den Link findest du unter Gestellte Duelle.');
    wechselZuMeineDuelle('btn-fuchsjagd-toggle', 'fuchsjagd-inhalt');
  } catch(e) { fehler.textContent = 'Fehler beim Erstellen. Bitte versuche es erneut.'; }
  btn.disabled = false; btn.textContent = 'Spiel speichern ⚔️';
});

// Link teilen — Event-Delegation auf der "Von dir gestellt"-Liste
document.getElementById('duelle-von-mir-liste').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-teile-duell-id]');
  if (!btn) return;
  const id = btn.dataset.teileDuellId;
  const ursprung = btn.textContent;
  btn.disabled = true; btn.textContent = 'Wird geteilt…';
  await teileDuell(id);
  btn.disabled = false; btn.textContent = ursprung;
});

// Eingabefelder: nur Buchstaben, Großbuchstaben erzwingen
['vergiftetes-loesung', 'vergiftetes-verhext', 'wortfuchs-eingabe'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', function() {
    this.value = this.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '').slice(0, 5);
  });
});

// Duell-Listeneinträge anklicken (Event-Delegation auf beiden Listen)
['duelle-fuer-mich-liste', 'duelle-von-mir-liste'].forEach(listId => {
  document.getElementById(listId)?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-duell-id]');
    if (!btn) return;
    const id = btn.dataset.duellId;
    const duell = await ladeDuell(id);
    if (!duell) { sageLaut('Duell nicht gefunden oder abgelaufen.'); return; }
    starteDuellSpiel(duell);
  });
});

// Emoji-Picker: Reaktion für Wortfuchs speichern
document.getElementById('duell-ergebnis-bereich')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.emoji-btn');
  if (!btn || !appState.duellModus) return;
  const emoji = btn.dataset.emoji;
  try {
    await speichereEmojiReaktion(appState.duellModus.id, emoji);
    document.querySelectorAll('.emoji-btn').forEach(b => {
      b.disabled = true;
      b.style.opacity = b.dataset.emoji === emoji ? '1' : '0.3';
      b.style.border = b.dataset.emoji === emoji ? '2px solid var(--accent)' : '2px solid transparent';
    });
    const gespeichert = document.getElementById('emoji-gespeichert');
    if (gespeichert) gespeichert.style.display = 'block';
    sageLaut(`Reaktion ${emoji} gespeichert.`);
  } catch(ex) {}
});


