import { appState } from './state.js';
import { auth, provider, signInWithPopup, onAuthStateChanged,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         sendPasswordResetEmail, signOut, deleteUser } from './firebase-config.js';
import { TAGES_IDX, HEUTE_KEY } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';
import { ladeSpitzname, spitznameVorhanden, speichereSpitzname, aendereSpitzname } from './firebase-basis.js';
import { db, ref, set } from './firebase-config.js';
import { syncGruppenBeiLogin } from './gruppen.js';
import { zeigeScreen } from './screens.js';
import { aktualisiereStartStats } from './lokaler-zustand.js';
import { sageLaut } from './live-region.js';
import { oeffneModal, schliesseModal } from './modal.js';
import { zeigeAdminBereich } from './admin.js';

// AUTH ANFANG
onAuthStateChanged(auth, async (user) => {
  if (user) {
    appState.currentUser = user;
    appState.currentSpitzname = await ladeSpitzname(user.uid);
    // Gruppen-Selbst-Sync: prüfe ob du irgendwo als Mitglied eingetragen bist
    await syncGruppenBeiLogin(user.uid);
  } else {
    appState.currentUser = null;
    appState.currentSpitzname = null;
  }
  aktualisiereStartseite();
});

export function aktualisiereStartseite() {
  const titel = document.getElementById('start-spiel-titel');
  const btnSpielStarten = document.getElementById('btn-spiel-starten');
  const willkommenBox = document.getElementById('start-willkommen-box');
  const accountNichtAngemeldet = document.getElementById('account-nicht-angemeldet');
  const accountAngemeldet = document.getElementById('account-angemeldet');
  const accountInfoText = document.getElementById('account-info-text');

  // Prüfen ob heute schon gespielt
  let heuteGespielt = false;
  try {
    const raw = localStorage.getItem(HEUTE_KEY);
    if (raw) { const s = JSON.parse(raw); heuteGespielt = s.spielende === true; }
  } catch(e) {}

  if (appState.currentUser && appState.currentSpitzname) {
    // Angemeldet
    if (heuteGespielt) {
      if (titel) titel.textContent = 'Du hast heute schon gespielt';
      if (btnSpielStarten) btnSpielStarten.textContent = '🦊 Ergebnis ansehen';
    } else {
      if (titel) titel.textContent = 'Spiele das heutige Tippfuchs Rätsel';
      if (btnSpielStarten) btnSpielStarten.textContent = '🦊 Jetzt spielen';
    }
    if (willkommenBox) willkommenBox.style.display = 'none';
    if (accountNichtAngemeldet) accountNichtAngemeldet.style.display = 'none';
    if (accountAngemeldet) accountAngemeldet.style.display = 'flex';
    if (accountInfoText) {
      const methode = appState.currentUser.providerData[0]?.providerId === 'google.com' ? 'Google' : 'E-Mail';
      accountInfoText.textContent = `Du bist als ${appState.currentSpitzname} mit ${methode} angemeldet.`;
    }
  } else {
    // Nicht angemeldet
    if (titel) titel.textContent = 'Anmelden und spielen';
    if (btnSpielStarten) btnSpielStarten.textContent = '🦊 Jetzt anmelden';
    if (willkommenBox) willkommenBox.style.display = 'block';
    if (accountNichtAngemeldet) accountNichtAngemeldet.style.display = 'flex';
    if (accountAngemeldet) accountAngemeldet.style.display = 'none';
  }

  // Tagessieger Meldung prüfen
  const siegBox = document.getElementById('tagessieger-meldung');
  try {
    const gespeichert = localStorage.getItem('tippfuchs_tagessieger');
    if (gespeichert && appState.currentUser) {
      const daten = JSON.parse(gespeichert);
      if (daten.tagIdx === TAGES_IDX - 1) {
        siegBox.style.display = 'block';
        siegBox.textContent = `🏆 Du warst gestern Tagessieger! Das Wort war ${daten.wort} am ${daten.datum}. Herzlichen Glückwunsch!`;
        sageLaut(`Du warst gestern Tagessieger! Das Wort war ${daten.wort}.`);
      } else {
        siegBox.style.display = 'none';
      }
    } else {
      siegBox.style.display = 'none';
    }
  } catch(e) { siegBox.style.display = 'none'; }

  aktualisiereStartStats();
  if (typeof window.aktualisiereHausPoolText === 'function') window.aktualisiereHausPoolText();
  zeigeAdminBereich();
}

export async function abmelden() {
  try {
    await signOut(auth);
    appState.currentUser = null;
    appState.currentSpitzname = null;
    aktualisiereStartseite();
    sageLaut('Du wurdest abgemeldet.');
  } catch(e) {
    sageLaut('Abmelden fehlgeschlagen.');
  }
}

export async function loescheAccount() {
  if (!appState.currentUser) return;
  const user = appState.currentUser;
  const uid = user.uid;
  const name = appState.currentSpitzname;
  try {
    if (name) await set(ref(db, `spitznamen/${name.toLowerCase()}`), null);
    await set(ref(db, `spieler/${uid}`), null);
    await deleteUser(user);
    appState.currentUser = null;
    appState.currentSpitzname = null;
    aktualisiereStartseite();
    sageLaut('Dein Account wurde gelöscht.');
  } catch(e) {
    if (e.code === 'auth/requires-recent-login') {
      sageLaut('Bitte melde dich erneut an um den Account zu löschen.');
      alert('Für das Löschen des Accounts musst du dich erneut anmelden. Bitte melde dich ab, danach wieder an und versuche es dann erneut.');
    } else {
      sageLaut('Fehler beim Löschen des Accounts. Bitte versuche es erneut.');
    }
  }
}
export async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch(e) { return null; }
}

// EMAIL-LOGIN ANFANG
let emailLoginModus = 'anmelden'; // 'anmelden' oder 'registrieren'

export function oeffneEmailModal() {
  emailLoginModus = 'anmelden';
  aktualisiereEmailModalTabs();
  document.getElementById('email-input').value = '';
  document.getElementById('passwort-input').value = '';
  document.getElementById('passwort-wiederholen-input').value = '';
  document.getElementById('email-login-fehler').textContent = '';
  oeffneModal('modal-email-login');
  setTimeout(() => document.getElementById('email-input').focus(), 100);
}

export function aktualisiereEmailModalTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const btnBestaetigen = document.getElementById('btn-email-login-bestaetigen');
  const wiederholenBereich = document.getElementById('passwort-wiederholen-bereich');
  const passwortVergessen = document.getElementById('btn-passwort-vergessen');
  if (emailLoginModus === 'anmelden') {
    tabLogin.style.background = 'var(--accent)';
    tabLogin.style.color = '#fff';
    tabRegister.style.background = 'var(--key-bg)';
    tabRegister.style.color = 'var(--text)';
    btnBestaetigen.textContent = 'Anmelden';
    wiederholenBereich.style.display = 'none';
    passwortVergessen.style.display = 'block';
  } else {
    tabRegister.style.background = 'var(--accent)';
    tabRegister.style.color = '#fff';
    tabLogin.style.background = 'var(--key-bg)';
    tabLogin.style.color = 'var(--text)';
    btnBestaetigen.textContent = 'Registrieren';
    wiederholenBereich.style.display = 'flex';
    passwortVergessen.style.display = 'none';
  }
}

document.getElementById('tab-login').addEventListener('click', () => {
  emailLoginModus = 'anmelden';
  aktualisiereEmailModalTabs();
  document.getElementById('email-login-fehler').textContent = '';
});
document.getElementById('tab-register').addEventListener('click', () => {
  emailLoginModus = 'registrieren';
  aktualisiereEmailModalTabs();
  document.getElementById('email-login-fehler').textContent = '';
});

document.getElementById('btn-email-login-bestaetigen').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  const passwort = document.getElementById('passwort-input').value;
  const fehler = document.getElementById('email-login-fehler');
  fehler.textContent = '';
  if (!email || !passwort) { fehler.textContent = 'Bitte E-Mail und Passwort eingeben.'; return; }
  if (emailLoginModus === 'registrieren') {
    const wiederholung = document.getElementById('passwort-wiederholen-input').value;
    if (passwort !== wiederholung) { fehler.textContent = 'Passwoerter stimmen nicht ueberein.'; return; }
    if (passwort.length < 6) { fehler.textContent = 'Passwort muss mindestens 6 Zeichen haben.'; return; }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, passwort);
      appState.currentUser = result.user;
      schliesseModal('modal-email-login');
      const name = await ladeSpitzname(appState.currentUser.uid);
      appState.currentSpitzname = name;
      aktualisiereStartseite();
      if (!name) {
        zeigeScreen('spitzname-screen');
        setTimeout(() => document.getElementById('spitzname-input').focus(), 100);
      } else { starteSpiel(); }
    } catch(e) {
      if (e.code === 'auth/email-already-in-use') fehler.textContent = 'E-Mail wird bereits verwendet.';
      else if (e.code === 'auth/invalid-email') fehler.textContent = 'Ungueltige E-Mail-Adresse.';
      else fehler.textContent = 'Fehler bei der Registrierung. Bitte versuche es erneut.';
    }
  } else {
    try {
      const result = await signInWithEmailAndPassword(auth, email, passwort);
      appState.currentUser = result.user;
      schliesseModal('modal-email-login');
      const name = await ladeSpitzname(appState.currentUser.uid);
      appState.currentSpitzname = name;
      aktualisiereStartseite();
      if (!name) {
        zeigeScreen('spitzname-screen');
        setTimeout(() => document.getElementById('spitzname-input').focus(), 100);
      } else { starteSpiel(); }
    } catch(e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') fehler.textContent = 'E-Mail oder Passwort falsch.';
      else if (e.code === 'auth/invalid-email') fehler.textContent = 'Ungueltige E-Mail-Adresse.';
      else fehler.textContent = 'Fehler beim Anmelden. Bitte versuche es erneut.';
    }
  }
});

document.getElementById('btn-passwort-vergessen').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  const fehler = document.getElementById('email-login-fehler');
  if (!email) { fehler.textContent = 'Bitte zuerst E-Mail eingeben.'; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    fehler.style.color = 'var(--correct-badge)';
    fehler.textContent = 'Passwort-Reset E-Mail wurde gesendet.';
    sageLaut('Passwort-Reset E-Mail wurde gesendet.');
  } catch(e) {
    fehler.style.color = '';
    fehler.textContent = 'Fehler beim Senden der Reset-E-Mail.';
  }
});

document.getElementById('email-login-close').addEventListener('click', () => schliesseModal('modal-email-login'));

document.getElementById('btn-mit-email').addEventListener('click', () => oeffneEmailModal());
// EMAIL-LOGIN ENDE
// AUTH ENDE

export function zeigeStart() {
  aktualisiereStartseite();
  zeigeScreen('start-screen');
  document.getElementById('fuchs-container').style.display = 'none';
}
