// PUSH-BENACHRICHTIGUNGEN ANFANG
import { appState } from './state.js';
import { db, ref, set, get, child, firebaseApp } from './firebase-config.js';
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";
import { sageLaut } from './live-region.js';

const VAPID_KEY = 'BODtxTHNXbFaOmpVg1j-Rw-_3FII9Nn4PyjpJDYqIM8tEGrrVnOERZ4cHfJDf4Ha11PX6XLtaQ4sK4LW-NH8H-M';

let _messaging = null;
function getMsg() {
  if (!_messaging) _messaging = getMessaging(firebaseApp);
  return _messaging;
}

const ALLE_CHECKBOXEN = [
  'push-zeit-1', 'push-zeit-2', 'push-zeit-3',
  'push-gruppe-alle', 'push-gruppe-anfrage', 'push-gruppe-angenommen',
  'push-gruppe-abgelehnt', 'push-gruppe-neu', 'push-gruppe-verlassen'
];

export async function ladePushPraeferenzen(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/push`));
    const prefs = snap.exists() ? snap.val() : {};

    // Zeiten laden
    const zeiten = prefs.zeiten || [];
    [1, 2, 3].forEach(i => {
      const z = zeiten[i - 1] || {};
      const cb = document.getElementById(`push-zeit-${i}`);
      const uhr = document.getElementById(`push-zeit-${i}-uhr`);
      if (cb) cb.checked = !!z.aktiv;
      if (uhr && z.uhrzeit) uhr.value = z.uhrzeit;
    });

    // Gruppen-Checkboxen laden
    const g = prefs.gruppe || {};
    const felder = ['alle', 'anfrage', 'angenommen', 'abgelehnt', 'neu', 'verlassen'];
    felder.forEach(f => {
      const cb = document.getElementById(`push-gruppe-${f}`);
      if (cb) cb.checked = !!g[f];
    });

    if (prefs.token) setzePushStatus('Benachrichtigungen aktiv.');
  } catch(e) {}
}

async function holeFCMToken() {
  const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(getMsg(), { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
  return token;
}

export async function speicherePushEinstellungen() {
  if (!appState.currentUser) return;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    setzePushStatus('Dein Browser unterstützt leider keine Push-Benachrichtigungen.');
    sageLaut('Push-Benachrichtigungen nicht unterstützt.');
    return;
  }

  if (Notification.permission === 'denied') {
    setzePushStatus('Benachrichtigungen sind blockiert. Bitte in den Browsereinstellungen erlauben.');
    sageLaut('Benachrichtigungen blockiert.');
    return;
  }

  if (Notification.permission === 'default') {
    setzePushStatus('Bitte Benachrichtigungen im Dialog erlauben...');
    const erlaubnis = await Notification.requestPermission();
    if (erlaubnis !== 'granted') {
      setzePushStatus('Nicht erlaubt. Bitte in den Browsereinstellungen aktivieren.');
      sageLaut('Benachrichtigungen nicht erlaubt.');
      return;
    }
  }

  // Prüfen ob überhaupt etwas aktiviert ist
  const irgendwasAktiv = ALLE_CHECKBOXEN.some(id => document.getElementById(id)?.checked);

  if (!irgendwasAktiv) {
    try {
      await set(ref(db, `spieler/${appState.currentUser.uid}/push`), null);
      setzePushStatus('Benachrichtigungen deaktiviert.');
      sageLaut('Benachrichtigungen deaktiviert.');
    } catch(e) {}
    return;
  }

  try {
    setzePushStatus('Wird gespeichert...');
    const token = await holeFCMToken();
    if (!token) {
      setzePushStatus('Fehler: Kein Token erhalten. Bitte Seite neu laden.');
      return;
    }

    // Zeiten sammeln
    const zeiten = [1, 2, 3].map(i => ({
      aktiv: !!document.getElementById(`push-zeit-${i}`)?.checked,
      uhrzeit: document.getElementById(`push-zeit-${i}-uhr`)?.value || '07:00'
    }));

    // Gruppeneinstellungen sammeln
    const gruppe = {};
    ['alle', 'anfrage', 'angenommen', 'abgelehnt', 'neu', 'verlassen'].forEach(f => {
      gruppe[f] = !!document.getElementById(`push-gruppe-${f}`)?.checked;
    });

    await set(ref(db, `spieler/${appState.currentUser.uid}/push`), {
      token, zeiten, gruppe
    });

    setzePushStatus('Gespeichert. Benachrichtigungen sind aktiv.');
    sageLaut('Benachrichtigungseinstellungen gespeichert.');
  } catch(e) {
    console.error('Push-Fehler:', e);
    setzePushStatus('Fehler beim Speichern: ' + (e.message || e));
    sageLaut('Fehler beim Speichern der Benachrichtigungen.');
  }
}

function setzePushStatus(text) {
  const el = document.getElementById('push-status');
  if (el) el.textContent = text;
}

export function registrierePushButtons() {
  // Alle aktivieren
  document.getElementById('btn-push-alle-an')?.addEventListener('click', () => {
    ALLE_CHECKBOXEN.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = true;
    });
    sageLaut('Alle Benachrichtigungen aktiviert.');
  });

  // Alle deaktivieren
  document.getElementById('btn-push-alle-aus')?.addEventListener('click', () => {
    ALLE_CHECKBOXEN.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = false;
    });
    sageLaut('Alle Benachrichtigungen deaktiviert.');
  });

  // Speichern
  document.getElementById('btn-push-speichern')?.addEventListener('click', speicherePushEinstellungen);
}
// PUSH-BENACHRICHTIGUNGEN ENDE
