import { appState } from './state.js';
import { auth, provider, signInWithPopup, onAuthStateChanged,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         sendPasswordResetEmail } from './firebase-config.js';
import { TAGES_IDX } from './tageswort.js';
import { getDatum } from './hilfsfunktionen.js';
import { ladeSpitzname, spitznameVorhanden, speichereSpitzname, aendereSpitzname } from './firebase-basis.js';
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
  const btnSpielStarten = document.getElementById('btn-spiel-starten');
  const btnMitKonto = document.getElementById('btn-mit-konto');
  const btnEmail = document.getElementById('btn-mit-email');

  if (appState.currentUser && appState.currentSpitzname) {
    // Angemeldet: großer Button oben + Google-Button anpassen
    btnSpielStarten.textContent = `🦊 Spiel starten als ${appState.currentSpitzname}`;
    btnMitKonto.textContent = `Mit Google Konto spielen (angemeldet als ${appState.currentSpitzname})`;
    btnEmail.style.display = 'none';
  } else {
    // Nicht angemeldet: großer Button scrollt nach unten zum Anmelde-Block
    btnSpielStarten.textContent = '🦊 Spielen / Anmelden';
    btnMitKonto.textContent = 'Mit Google Konto spielen';
    btnEmail.style.display = 'block';
  }

  // Tagessieger Meldung prüfen
  const siegBox = document.getElementById('tagessieger-meldung');
  try {
    const gespeichert = localStorage.getItem('tippfuchs_tagessieger');
    if (gespeichert && appState.currentUser) {
      const daten = JSON.parse(gespeichert);
      // Nur anzeigen wenn es von gestern ist
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
  } catch(e) {
    siegBox.style.display = 'none';
  }

  aktualisiereStartStats();
  if (typeof window.aktualisiereHausPoolText === 'function') window.aktualisiereHausPoolText();
  zeigeAdminBereich();
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
