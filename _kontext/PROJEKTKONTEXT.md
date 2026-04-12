# Tippfuchs — Projektkontext für Claude Code

Dieses Dokument enthält alles, was du brauchst, um nach einer Kontext-Komprimierung direkt weiterzuarbeiten.

---

## Wer ist der Nutzer?

**Pascal** — blind, nutzt einen Screen Reader. Barrierefreiheit ist kein optionales Feature, sondern eine Grundanforderung jedes Elements. Niemals rein visuelles Feedback ohne ARIA-Announcement (`sageLaut()`). Kommunikation auf Deutsch.

---

## Was ist Tippfuchs?

Ein deutsches tägliches Worträtsel (Wordle-Klon). 5 Buchstaben, 6 Versuche, jeden Tag ein neues Wort. Mit Gruppen-Wettkampf, globaler Rangliste, Freundesliste und vollständiger Barrierefreiheit.

**Live-URL:** `https://blindmove.blogspot.com/p/tippfuchs.html`

---

## GitHub

**Repository:** `https://github.com/1013hPascal/tippfuchs`
**Branch:** `main`
**Tags:** `v1`, `v2` (bereits gesetzt)

### Git-Repo liegt in:
```
C:\Users\pasca\OneDrive\Unterlagen\Privat\Code-Projekte\Wordle\Konzept umsetzung\src\
```

Das `src\`-Verzeichnis hat sein eigenes `.git`. Immer von dort aus git-Befehle ausführen:

```bash
cd "C:\Users\pasca\OneDrive\Unterlagen\Privat\Code-Projekte\Wordle\Konzept umsetzung\src"
git add <dateien>
git commit -m "..."
git push origin main
```

**Tag setzen:**
```bash
git tag v3
git push origin v3
```

---

## Projektstruktur

```
Konzept umsetzung\
├── _kontext\              ← dieser Ordner (Projektkontext)
├── src\                   ← das eigentliche Projekt + Git-Repo
│   ├── index.html         ← Haupt-HTML (alle Screens, alle Modals)
│   ├── css\
│   │   ├── variables.css  ← CSS-Variablen und Themes
│   │   ├── layout.css     ← Layout und Grid
│   │   ├── components.css ← Buttons, Modals, Karten, etc.
│   │   ├── game.css       ← Spielfeld, Tastaturgitter
│   │   ├── screens.css    ← Screen-spezifische Styles
│   │   └── designs.css    ← Farbthemen (Fuchsbau, Natur etc.)
│   └── js\
│       ├── main.js        ← Einstiegspunkt, URL-Parameter, App-Start
│       ├── state.js       ← globaler appState und state
│       ├── auth.js        ← Firebase-Auth, Login, Abmelden, Account löschen
│       ├── event-listener.js ← alle Button-/Input-Listener
│       ├── screens.js     ← Screen-Navigation, globaler Zurück-Button
│       ├── modal.js       ← Modal öffnen/schließen (display:none-basiert)
│       ├── spiellogik.js  ← Spielablauf, Worteingabe, Farben
│       ├── tageswort.js   ← TAGES_IDX, HEUTE_KEY, Tageswort laden
│       ├── loesungswoerter.js ← LOESUNGSWOERTER-Array
│       ├── eingabewoerter.js  ← EINGABEWOERTER-Array (Validierung)
│       ├── firebase-config.js ← Firebase-Init + alle Re-Exports
│       ├── firebase-basis.js  ← Spitzname, Rangliste, Spieler-Daten
│       ├── gruppen.js     ← Gruppen-Logik (erstellen, beitreten, verlassen)
│       ├── gruppen-ui.js  ← Gruppen-UI (Screens, Detailansicht, Teilen)
│       ├── freundesliste.js   ← Freundesliste-Logik
│       ├── freundesliste-ui.js ← Freundesliste-UI
│       ├── lokaler-zustand.js ← localStorage, persönliche Statistik
│       ├── statistik.js   ← Statistik-Screen (Bot-Liste, Datum-Filter)
│       ├── rangliste.js   ← Tagesrangliste
│       ├── timer.js       ← Spieltimer, formatZeit()
│       ├── teilen.js      ← Ergebnis teilen
│       ├── design.js      ← Dark Mode, Themes
│       ├── animations.js  ← Animations-Einstellungen
│       ├── live-region.js ← sageLaut() für Screen Reader
│       ├── anleitung.js   ← Accordion-Anleitung
│       ├── admin.js       ← Admin-Bereich
│       ├── hilfsfunktionen.js ← Datum, Hilfsfunktionen
│       ├── fuchs-animation.js ← Fuchs-SVG-Animation
│       └── haus-fenster.js    ← Haus-Fenster-Animation
├── CLAUDE.md              ← Architektur-Überblick (für Claude Code)
└── Code-Tauscher.py       ← PySide6-Tool zum Propagieren von Code-Abschnitten
```

---

## Architektur-Grundregeln

- **ES-Module** mit `import`/`export` — kein Bundle, kein Build-Schritt
- **Kein Framework** — reines vanilla JS
- **`appState`** (aus `state.js`) ist der globale Zustand, von allen Modulen geteilt
- **`sageLaut(text)`** aus `live-region.js` — MUSS bei jeder wichtigen Aktion aufgerufen werden (Screen Reader)
- **Modals** arbeiten mit `display:none`/`display:flex` + CSS-Klasse `.open`. Immer `oeffneModal()` / `schliesseModal()` aus `modal.js` verwenden — niemals direkt DOM manipulieren
- **Screen-Navigation**: immer `zeigeScreen(id)` aus `screens.js` — setzt globalen Zurück-Button automatisch
- **Collapsible-Bereiche**: `registriereToggle(btnId, inhaltId, label)` in `event-listener.js` — WAI-ARIA-Accordion-Pattern mit `aria-expanded`

---

## Firebase

- **Realtime Database** (kein Firestore)
- **Auth**: Google-Login und E-Mail/Passwort
- Datenpfade:
  - `spieler/${uid}/spitzname` — Spielername
  - `spieler/${uid}/gruppen/${gruppenId}` — Gruppen-Mitgliedschaft
  - `spieler/${uid}/anfragen/${gruppenId}` — eigene ausstehende Beitrittsanfragen
  - `gruppen/${id}` — Gruppenobjekt mit mitglieder, anfragen, bestOfTime
  - `tageswoerter/${idx}` — Lösungswort für Tag idx
  - `rangliste/${idx}/${uid}` — Tagesergebnis

---

## Wichtige IDs im HTML (index.html)

### Screens (alle `<section>` unter `<main>`):
- `start-screen`, `spiel-screen`, `ergebnis-screen`, `spitzname-screen`
- `alle-stats-screen`, `gruppen-screen`, `gruppe-detail-screen`

### Wichtige Elemente:
- `gruppen-inhalt` — Content-Bereich im Gruppen-Screen (nicht mit `start-gruppen-inhalt` verwechseln!)
- `start-gruppen-inhalt` — ausklappbarer Gruppen-Bereich auf der Startseite
- `meine-gruppen-liste` — Liste der eigenen Gruppen
- `gruppe-id-anzeige` — zeigt Gruppen-ID im Detail-Screen
- `btn-gruppe-code-teilen` — Teilen-Button im Detail-Screen
- `global-top-zurueck` / `btn-global-zurueck-top` — globaler Zurück-Button oben

### Modals:
- `modal-email-login`, `modal-spitzname`
- `modal-gruppe-erstellen`, `modal-gruppe-beitreten`, `modal-gruppe-verlassen`

---

## Barrierefreiheit-Checkliste

Bei jeder Änderung prüfen:
1. Gibt es `sageLaut()` für die Aktion?
2. Hat jeder interaktive Button ein `aria-label` oder sichtbaren Text?
3. Nutzt das Accordion-Pattern `aria-expanded` + `aria-controls`?
4. Kein `confirm()` / `alert()` / `prompt()` — diese Dialoge sind für Screen Reader problematisch. Stattdessen Modals oder `sageLaut()` verwenden (Ausnahme: Account löschen)
5. Modals haben `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, und werden mit `display:none` wirklich versteckt

---

## Direkter Beitrittslink (neu implementiert)

URL-Parameter: `?beitreten=GRUPPENCODE`

Ablauf:
1. `main.js` liest den Parameter beim Start → `appState.pendingBeitreten`
2. Nach Login mit Spitzname → Modal `modal-gruppe-beitreten` öffnet sich vorausgefüllt
3. Nutzer klickt "Anfrage senden" → Bestätigung
4. Gruppen-Screen wird gezeigt mit aktualisierter Liste

Teilen-Button (`btn-gruppe-code-teilen`) generiert: `https://blindmove.blogspot.com/p/tippfuchs.html?beitreten=${gruppenId}`

---

## Was wurde in den letzten Sessions gemacht?

Chronologisch (neueste zuerst):

1. **Modal-Fix**: `display:none` beim Schließen, `confirm()` aus Gruppen-Modals entfernt
2. **Direkter Beitrittslink**: URL-Parameter + Modal vorausgefüllt + Teilen-Button
3. **Eigene ausstehende Anfragen**: in Gruppenliste angezeigt wenn noch kein Mitglied
4. **Gruppen-Screen** umstrukturiert: Überschriften, ausklappbare Verwaltungsbereiche
5. **Globaler Zurück-Button** oben auf jeder Unterseite
6. **Heute-Ansicht** in Erfolge, Gruppen, Freundesliste (nur gespielt/nicht gespielt)
7. **Startseite** dynamisch nach Login-Status (Spielen / Ergebnis ansehen)
8. **Alle Bereiche** ausklappbar (Accordion-Pattern)
9. **Wortliste** aufgeteilt in `loesungswoerter.js` und `eingabewoerter.js`
10. **Modular-Refactoring**: von einer monolithischen HTML-Datei zu CSS/JS-Modulen
