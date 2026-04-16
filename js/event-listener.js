import { appState } from './state.js';
import { TAGES_IDX } from './tageswort.js';
import { ladeSpitzname, spitznameVorhanden, speichereSpitzname, aendereSpitzname } from './firebase-basis.js';
import { zeigeScreen } from './screens.js';
import { zeigeStart, aktualisiereStartseite, googleLogin, abmelden, loescheAccount } from './auth.js';
import { starteSpiel, verarbeiteWort, zeigeErgebnis } from './spiellogik.js';
import { zeigeTagesrangliste } from './rangliste.js';
import { ladeBotListe, ladeTagsSelect, ladeMonatSelect, ladeJahrSelect } from './statistik.js';
import { zeigeGruppenScreen, zeigeGruppeVerlassenModal, ladeMeineGruppenListe, zeigeGruppeDetail, stoppeGruppenRefresh } from './gruppen-ui.js';
import { erstelleGruppe, ladeGruppe, sendeAnfrage, verlasseGruppe } from './gruppen.js';
import { teile, teileRangliste } from './teilen.js';
import { oeffneModal, schliesseModal, schliesseAlleModals } from './modal.js';
import { setzeDark } from './design.js';
import { sageLaut } from './live-region.js';
import { registrierePushButtons, speichereOnboardingErinnerung } from './push-benachrichtigungen.js';

// EVENT-LISTENER ANFANG
// Haupt-Spielen-Button oben
document.getElementById('btn-spiel-starten').addEventListener('click', () => {
  if (appState.currentUser && appState.currentSpitzname) {
    // Angemeldet → direkt spielen
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
document.getElementById('wort-input').addEventListener('input',function(){ this.value=this.value.toUpperCase().replace(/[^A-ZÄÖÜẞ]/g,'').slice(0,5); });
document.getElementById('wort-input').addEventListener('keydown',function(e){ if (e.key==='Enter') { e.preventDefault(); verarbeiteWort(); } if (e.key==='Escape') { this.value=''; this.blur(); sageLaut('Eingabe abgebrochen.'); } });

// Grafische QWERTZ-Tastatur
document.getElementById('grafik-tastatur')?.addEventListener('click', e => {
  const taste = e.target.closest('.taste[data-key]');
  if (!taste) return;
  const key = taste.dataset.key;
  const input = document.getElementById('wort-input');
  if (key === 'Backspace') {
    input.value = input.value.slice(0, -1);
  } else if (key === 'Enter') {
    verarbeiteWort();
  } else {
    if (input.value.length < 5) {
      input.value += key;
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
document.getElementById('btn-zurueck-zum-menue').addEventListener('click', zeigeStart);
document.getElementById('btn-zurueck-erg').addEventListener('click', zeigeStart);
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

registriereToggle('btn-push-toggle',      'push-inhalt',             'Benachrichtigungen einstellen');
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
registriereToggle('btn-gruppen-toggle',   'start-gruppen-inhalt',    'Meine Tippfuchsgruppen');
registriereToggle('btn-stats-toggle',     'stats-inhalt',            'Statistik aller Tippfüchse');
registriereToggle('btn-account-toggle',   'account-inhalt',          'Account');
registriereToggle('btn-design-toggle',    'design-inhalt',           'Design auswaehlen');
registriereToggle('btn-anleitung-toggle',         'anleitung-toggle-inhalt',  'Anleitung und Hilfe');
registriereToggle('btn-philosophie-toggle',       'philosophie-inhalt',       'Philosophie');
registriereToggle('btn-lizenzen-toggle',          'lizenzen-inhalt',          'Quellen und Lizenzen');
registriereToggle('btn-gruppen-verwalten-toggle', 'gruppen-verwalten-inhalt', 'Tippfuchsgruppen verwalten');
registriereToggle('btn-freunde-verwalten-toggle', 'freunde-verwalten-inhalt', 'Freundesliste verwalten');


