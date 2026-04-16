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
  'push-erinnerung',
  'push-gruppe-alle', 'push-gruppe-anfrage', 'push-gruppe-angenommen',
  'push-gruppe-abgelehnt', 'push-gruppe-neu', 'push-gruppe-verlassen'
];

export async function ladePushPraeferenzen(uid) {
  try {
    const snap = await get(child(ref(db), `spieler/${uid}/push`));
    const prefs = snap.exists() ? snap.val() : {};

    // Tägliche Erinnerung laden
    const erin = prefs.erinnerung || {};
    const cbErin = document.getElementById('push-erinnerung');
    const selStunde = document.getElementById('push-erinnerung-stunde');
    if (cbErin) cbErin.checked = !!erin.aktiv;
    if (selStunde && erin.stunde !== undefined) selStunde.value = String(erin.stunde);

    // Gruppeneinstellungen laden
    const g = prefs.gruppe || {};
    ['alle', 'anfrage', 'angenommen', 'abgelehnt', 'neu', 'verlassen'].forEach(f => {
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
    sageLaut('Push-Benachrichtigungen nicht unterstuetzt.');
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

    const erinnerung = {
      aktiv: !!document.getElementById('push-erinnerung')?.checked,
      stunde: parseInt(document.getElementById('push-erinnerung-stunde')?.value || '12')
    };

    const gruppe = {};
    ['alle', 'anfrage', 'angenommen', 'abgelehnt', 'neu', 'verlassen'].forEach(f => {
      gruppe[f] = !!document.getElementById(`push-gruppe-${f}`)?.checked;
    });

    await set(ref(db, `spieler/${appState.currentUser.uid}/push`), {
      token, erinnerung, gruppe
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

export async function speichereOnboardingErinnerung() {
  const status = document.getElementById('onb-push-status');
  const aktiv = !!document.getElementById('onb-erinnerung-aktiv')?.checked;

  if (!aktiv) return; // Kein Speichern nötig, wenn nicht aktiviert

  if (!appState.currentUser) return;

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    if (status) status.textContent = 'Dein Browser unterstützt leider keine Push-Benachrichtigungen.';
    return;
  }

  if (Notification.permission === 'denied') {
    if (status) status.textContent = 'Benachrichtigungen sind blockiert. In den Browsereinstellungen aktivieren.';
    return;
  }

  if (Notification.permission === 'default') {
    if (status) status.textContent = 'Bitte erlaube Benachrichtigungen im Dialog...';
    const erlaubnis = await Notification.requestPermission();
    if (erlaubnis !== 'granted') {
      if (status) status.textContent = 'Nicht erlaubt — du kannst das später in den Einstellungen aktivieren.';
      return;
    }
  }

  try {
    if (status) status.textContent = 'Wird gespeichert...';
    const token = await holeFCMToken();
    if (!token) {
      if (status) status.textContent = 'Fehler: Kein Token erhalten.';
      return;
    }
    const stunde = parseInt(document.getElementById('onb-erinnerung-stunde')?.value || '12');
    await set(ref(db, `spieler/${appState.currentUser.uid}/push`), {
      token,
      erinnerung: { aktiv: true, stunde },
      gruppe: { alle: false, anfrage: false, angenommen: false, abgelehnt: false, neu: false, verlassen: false }
    });
    if (status) status.textContent = 'Gespeichert!';
  } catch(e) {
    if (status) status.textContent = 'Fehler beim Speichern. Du kannst das später in den Einstellungen aktivieren.';
  }
}

export function registrierePushButtons() {
  document.getElementById('btn-push-alle-an')?.addEventListener('click', () => {
    ALLE_CHECKBOXEN.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = true;
    });
    sageLaut('Alle Benachrichtigungen aktiviert.');
  });

  document.getElementById('btn-push-alle-aus')?.addEventListener('click', () => {
    ALLE_CHECKBOXEN.forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = false;
    });
    sageLaut('Alle Benachrichtigungen deaktiviert.');
  });

  document.getElementById('btn-push-speichern')?.addEventListener('click', speicherePushEinstellungen);
}
// PUSH-BENACHRICHTIGUNGEN ENDE
