"""
Tippfuchs Push-Sender
Läuft stündlich via GitHub Actions.
Sendet Push-Benachrichtigungen basierend auf Nutzereinstellungen.
"""
import json
import os
import sys
from datetime import date, datetime
import pytz
import firebase_admin
from firebase_admin import credentials, db, messaging

# ── Initialisierung ──────────────────────────────────────────────
SERVICE_ACCOUNT_JSON = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
if not SERVICE_ACCOUNT_JSON:
    print("Fehler: FIREBASE_SERVICE_ACCOUNT nicht gesetzt.")
    sys.exit(1)

cred_dict = json.loads(SERVICE_ACCOUNT_JSON)
cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://wortjaeger-blindmove-default-rtdb.europe-west1.firebasedatabase.app'
})

# ── Zeitberechnung ───────────────────────────────────────────────
DE_TZ = pytz.timezone('Europe/Berlin')
jetzt_de = datetime.now(DE_TZ)
aktuelle_stunde = jetzt_de.hour

# TAGES_IDX: Tage seit 2025-01-01 (UTC-Mitternacht, wie im JS)
heute_utc = date.today()
start = date(2025, 1, 1)
tages_idx = (heute_utc - start).days

print(f"Läuft: {jetzt_de.strftime('%d.%m.%Y %H:%M')} Uhr (DE), Stunde={aktuelle_stunde}, TAGES_IDX={tages_idx}")

# ── Hilfsfunktionen ──────────────────────────────────────────────
def sende_push(token, titel, text):
    try:
        messaging.send(messaging.Message(
            notification=messaging.Notification(title=titel, body=text),
            token=token
        ))
        print(f"  Push gesendet: {titel}")
        return True
    except Exception as e:
        print(f"  Push Fehler: {e}")
        return False

def hat_heute_gespielt(spieler_daten):
    """Prüft ob Spieler heute gespielt hat (Historie-Eintrag vorhanden)."""
    historie = spieler_daten.get('historie', {})
    return str(tages_idx) in historie

def setze_flag(uid, schluessel, wert):
    """Speichert ein Flag in Firebase."""
    db.reference(f'spieler/{uid}/push-state/{schluessel}').set(wert)

def lese_flag(spieler_daten, schluessel, standard=None):
    """Liest ein Flag aus Spielerdaten."""
    return spieler_daten.get('push-state', {}).get(schluessel, standard)

# ── Alle Spieler laden ───────────────────────────────────────────
alle_spieler = db.reference('spieler').get() or {}
alle_gruppen = db.reference('gruppen').get() or {}
heute_str = heute_utc.isoformat()

gesendete_pushes = 0

for uid, daten in alle_spieler.items():
    if not isinstance(daten, dict):
        continue

    push_prefs = daten.get('push')
    if not push_prefs or not push_prefs.get('token'):
        continue

    token = push_prefs['token']
    spitzname = daten.get('spitzname', uid[:8])

    # ── 1. Tägliche Erinnerung ────────────────────────────────────
    erin = push_prefs.get('erinnerung', {})
    if erin.get('aktiv') and int(erin.get('stunde', -1)) == aktuelle_stunde:
        letzteErin = lese_flag(daten, f'erinnerung_{tages_idx}', False)
        if not letzteErin and not hat_heute_gespielt(daten):
            if sende_push(token, 'Tippfuchs ⏰', f'Hallo {spitzname}! Du hast heute noch nicht gespielt. Viel Spaß!'):
                setze_flag(uid, f'erinnerung_{tages_idx}', True)
                gesendete_pushes += 1

    # ── 2. Gruppe: alle haben gespielt außer ich ──────────────────
    gruppe_prefs = push_prefs.get('gruppe', {})
    if gruppe_prefs.get('alle') and not hat_heute_gespielt(daten):
        eigene_gruppen = daten.get('gruppen', {})
        for gruppen_id in eigene_gruppen:
            gruppe = alle_gruppen.get(gruppen_id)
            if not gruppe or not isinstance(gruppe.get('mitglieder'), dict):
                continue
            mitglieder = gruppe['mitglieder']
            # Alle anderen Mitglieder haben gespielt?
            alle_anderen_gespielt = all(
                hat_heute_gespielt(alle_spieler.get(m_uid, {}))
                for m_uid in mitglieder if m_uid != uid
            )
            if alle_anderen_gespielt and len(mitglieder) > 1:
                flag_key = f'gruppe_alle_{gruppen_id}_{tages_idx}'
                if not lese_flag(daten, flag_key, False):
                    gruppenname = gruppe.get('name', 'deiner Gruppe')
                    if sende_push(token, 'Tippfuchs 👥', f'Alle in "{gruppenname}" haben gespielt — nur du noch nicht!'):
                        setze_flag(uid, flag_key, True)
                        gesendete_pushes += 1

    # ── 3. Gruppenänderungen ──────────────────────────────────────
    eigene_gruppen = daten.get('gruppen', {})

    for gruppen_id in eigene_gruppen:
        gruppe = alle_gruppen.get(gruppen_id)
        if not gruppe or not isinstance(gruppe, dict):
            continue

        gruppenname = gruppe.get('name', gruppen_id)
        mitglieder = gruppe.get('mitglieder', {})
        anfragen = gruppe.get('anfragen', {})

        # Mitgliederanzahl gespeichert?
        bekannte_anzahl = lese_flag(daten, f'gruppe_{gruppen_id}_mitglieder', None)
        aktuelle_anzahl = len(mitglieder)

        if bekannte_anzahl is not None:
            diff = aktuelle_anzahl - int(bekannte_anzahl)
            if diff > 0 and gruppe_prefs.get('neu'):
                neues_mitglied = next(
                    (m['name'] for m_uid, m in mitglieder.items()
                     if isinstance(m, dict) and m_uid != uid
                     and m.get('beigetreten', 0) > (datetime.now().timestamp() - 7200) * 1000),
                    'Jemand'
                )
                sende_push(token, 'Tippfuchs 🎉', f'{neues_mitglied} ist "{gruppenname}" beigetreten!')
                gesendete_pushes += 1
            elif diff < 0 and gruppe_prefs.get('verlassen'):
                sende_push(token, 'Tippfuchs 👋', f'Ein Mitglied hat "{gruppenname}" verlassen.')
                gesendete_pushes += 1

        # Aktuelle Anzahl speichern
        if bekannte_anzahl != aktuelle_anzahl:
            setze_flag(uid, f'gruppe_{gruppen_id}_mitglieder', aktuelle_anzahl)

        # Anfragen (nur für Gruppenadmin = erster Eintrag)
        bekannte_anfragen = lese_flag(daten, f'gruppe_{gruppen_id}_anfragen', 0)
        aktuelle_anfragen = len(anfragen)
        if aktuelle_anfragen > int(bekannte_anfragen) and gruppe_prefs.get('anfrage'):
            sende_push(token, 'Tippfuchs 📬', f'Neue Beitrittsanfrage in "{gruppenname}"!')
            gesendete_pushes += 1
        if bekannte_anfragen != aktuelle_anfragen:
            setze_flag(uid, f'gruppe_{gruppen_id}_anfragen', aktuelle_anfragen)

print(f"\nFertig. {gesendete_pushes} Push(es) gesendet.")
