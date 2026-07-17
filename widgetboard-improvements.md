# WidgetBoard Improvements Plan

## Goal
Portare WidgetBoard da pre-release (v0.0.0) a production-ready con copertura test,
accessibilità WCAG 2.2 AA, performance ottimizzata, 2 nuovi widget, e infrastruttura di sviluppo.

## Scope
- In: LICENSE, AI env vars, IndexedDB storage, test coverage, performance memo/virtualization,
       Timer + Kanban widgets, WCAG 2.2 AA fixes, Storybook, widget connections,
       perf benchmarks, changelog automation
- Out: Cloud sync, presentation mode, custom themes, Chart/Media/Map widgets

---

## Task 1: LICENSE file
**Impatto:** Infrastruttura | **Durata:** 2 min

Il README referenzia `LICENSE` ma non esiste. Creare `LICENSE` con MIT.

- [x] Creare `/home/gio/Desktop/widgetboard/LICENSE` con testo licenza MIT standard
- **Verify:** `ls LICENSE` esiste

---

## Task 2: Endpoint AI configurabile via env
**Impatto:** Feature | **Durata:** 10 min | **Dipende da:** Task 1

L'URL AI e il model sono hardcoded in 2 file. Spostarli in variabili d'ambiente.

File:
- `src/hooks/usePageAgent.ts:25-27` — sostituire default hardcoded con `import.meta.env`
- `src/components/AgentSettingsModal.tsx:65,81` — placeholder da env
- Creare `.env.example` con `VITE_AI_ENDPOINT=` e `VITE_AI_MODEL=`

- [ ] Modificare `src/hooks/usePageAgent.ts` — leggere default da `import.meta.env.VITE_AI_ENDPOINT` e `VITE_AI_MODEL`
- [ ] Modificare `src/components/AgentSettingsModal.tsx` — placeholder da env
- [ ] Creare `.env.example`
- **Verify:** `npm run dev` non crasha, AgentSettings mostra placeholder vuoti

---

## Task 3: IndexedDB storage adapter per superare 5MB localStorage
**Impatto:** Feature | **Durata:** 1-2 ore | **Dipende da:** nessuna

localStorage ha limite ~5MB. Con 24 widget, board nidificate e immagini, si riempie in fretta.
Il pattern esiste già in `src/utils/imageStore.ts`. Estenderlo a un data store generico.

- [ ] 3a. Creare `src/utils/dataStore.ts` — wrapper IndexedDB per chiave/valore con API simile a localStorage
- [ ] 3b. Modificare `src/store/useStore.ts` — storage adapter che scrive dati widget in IndexedDB,
      mantiene in localStorage solo metadati (version, currentBoardId, navigationStack)
- [ ] 3c. Aggiungere migrazione automatica: al primo load, sposta dati da localStorage a IndexedDB
- [ ] 3d. Aggiungere indicatore spazio in `src/components/SettingsModal.tsx` (stima quota IndexedDB usata)
- **Verify:** `npm test` — i test store esistenti passano ancora, aprire app con localStorage pieno >5MB non crasha

---

## Task 4: Test coverage
**Impatto:** Qualità | **Durata:** 3-4 ore | **Dipende da:** nessuna

Situazione attuale: 79 unit test (solo store + Widget + Toolbar), 3 test E2E (solo smoke).
Zero test per 24 widget, 12 hooks, 7 canvas subcomponents, 6 utils, tools.

### 4a. Widget tests (6 prioritari)
- [ ] `src/widgets/__tests__/NoteWidget.test.tsx` — render markdown, cambio categoria, edit/preview toggle
- [ ] `src/widgets/__tests__/TodoWidget.test.tsx` — aggiungi task, completa, filtri, subtask, priorità
- [ ] `src/widgets/__tests__/ClockWidget.test.tsx` — render ora, toggle 12/24h, change theme, alarm
- [ ] `src/widgets/__tests__/CalcWidget.test.tsx` — operazioni base, history, scientific mode toggle
- [ ] `src/widgets/__tests__/WeatherWidget.test.tsx` — aggiungi/rimuovi città, mock fetch meteo
- [ ] `src/widgets/__tests__/StickyWidget.test.tsx` — crea nota, cambia colore, aggiungi tag

### 4b. Hooks tests
- [ ] `src/hooks/__tests__/useKeyboardShortcut.test.ts` — attivazione shortcut, mancata attivazione senza focus
- [ ] `src/hooks/__tests__/useLocalStorage.test.ts` — get/set/remove, persistenza, default value
- [ ] `src/hooks/__tests__/useDebouncedValue.test.ts` — debounce timing, value update

### 4c. Utils tests
- [ ] `src/utils/__tests__/colors.test.ts` — HSL↔Hex↔RGB, luminance, palette generators
- [ ] `src/utils/__tests__/date.test.ts` — relative time, edge case (oggi, ieri, futuro)
- [ ] `src/utils/__tests__/string.test.ts` — escapeHtml, truncate, slugify, stripHtml
- [ ] `src/utils/__tests__/clipboard.test.ts` — copyToClipboard call, fallback execCommand

### 4d. Tools tests
- [ ] `src/tools/__tests__/widgetboardTools.test.ts` — mock store, test ogni tool (list/add/remove/move/update/undo/redo)

### 4e. E2E tests
- [ ] `tests/e2e/widgets.spec.ts` — aggiungi Note, modifica testo, verifica salvataggio; aggiungi Todo, completa task
- [ ] `tests/e2e/boards.spec.ts` — crea nuova board, naviga, torna indietro, elimina board

### 4f. Coverage config
- [ ] Aggiungere coverage provider in `vite.config.ts` (test.coverage.provider = 'v8', include src, thresholds)
- **Verify:** `npm run test:coverage` produce report, `npm test` passa (tutti i nuovi test verdi)

---

## Task 5: Performance optimization
**Impatto:** UX | **Durata:** 2-3 ore | **Dipende da:** nessuna

Dall'analisi approfondita, i problemi principali sono:
1. Canvas non memoizzato — ogni store change ri-renderizza tutto
2. ForcePushHistory chiama structuredClone su OGNI boards a ogni frame di resize (60fps)
3. WidgetContext.Provider value instabile — tutti i WidgetHeader ri-renderizzano
4. Nessuna virtualizzazione — tutti i widget renderizzati anche fuori viewport
5. ClockWidget senza useCallback — funzioni ricreate ogni secondo
6. CanvasElements, GroupRenderer, TextRenderer, ArrowRenderer, ShapeRenderer senza memo

### 5a. Memo su componenti non wrappati
- [ ] `src/components/Canvas.tsx:32` — `export const Canvas = memo(function Canvas(...)`
- [ ] `src/components/canvas/CanvasElements.tsx` — wrap in `React.memo`
- [ ] `src/components/canvas/GroupRenderer.tsx` — wrap in `React.memo`
- [ ] `src/components/canvas/TextRenderer.tsx` — wrap in `React.memo`
- [ ] `src/components/canvas/ArrowRenderer.tsx` — wrap in `React.memo`
- [ ] `src/components/canvas/ShapeRenderer.tsx` — wrap in `React.memo`
- [ ] `src/widgets/base/WidgetHeader.tsx` — wrap in `React.memo`

### 5b. Fix WidgetContext.Provider value instability
- [ ] `src/components/Widget.tsx:272` — memoizzare `{ widgetId, boardId }` con `useMemo([widget.id, boardId])`

### 5c. Fix cardClassName in Widget.tsx
- [ ] `src/components/Widget.tsx:227-233` — wrap in `useMemo`

### 5d. ClockWidget callbacks
- [ ] `src/widgets/ClockWidget.tsx` — wrappare `addAlarm`, `toggleAlarm`, `removeAlarm`, `toggle12h` in `useCallback`

### 5e. Throttle forcePushHistory durante resize
- [ ] `src/store/historySlice.ts` — aggiungere throttling anche a `forcePushHistory` (o usare requestAnimationFrame)
- [ ] `src/store/widgetSlice.ts` — nella resize, clonare solo la board corrente, non tutte le boards

### 5f. Viewport culling (virtualizzazione base)
- [ ] `src/components/Canvas.tsx:740,781` — calcolare viewport bounds da canvasScale/canvasOffset,
      filtrare widget fuori viewport (con margine di 200px) prima del .map()

### 5g. Stabilizzare DnD sensors
- [ ] `src/components/Canvas.tsx:687` — spostare `useSensors()` fuori dal componente o memoizzarlo

- **Verify:** `npm run build && npm run preview`, aprire app con board da 100+ widget, scroll/zoom fluido, resize senza lag

---

## Task 6: Nuovi widget (Timer + Kanban)
**Impatto:** Feature | **Durata:** 3-4 ore | **Dipende da:** nessuna

### 6a. TimerWidget (cronometro + countdown)
- [ ] Creare `src/widgets/TimerWidget.tsx`
  - Modalità: cronometro (count-up) e timer (count-down)
  - Start/pausa/reset, input minuti/secondi per countdown
  - Notifica al termine (Notification API o alert visivo)
  - Usa `useGlobalTick` per l'aggiornamento ogni secondo
- [ ] Aggiungere `TimerWidget` a `src/widgets/registry.tsx`
- [ ] Aggiungere tipo `timer` in `src/types/index.ts` (WidgetType + TimerContent)
- [ ] Aggiungere defaults in `src/store/utils.ts`

### 6b. KanbanWidget
- [ ] Creare `src/widgets/KanbanWidget.tsx`
  - 3+ colonne configurabili con titolo
  - Card drag-and-drop tra colonne (usa @dnd-kit già installato)
  - Aggiungi/rimuovi/rinomina card e colonne
- [ ] Aggiungere `KanbanWidget` a `src/widgets/registry.tsx`
- [ ] Aggiungere tipo `kanban` in `src/types/index.ts`
- [ ] Aggiungere defaults in `src/store/utils.ts`

- **Verify:** I 2 widget appaiono nel picker, si possono aggiungere alla board,
  TimerWidget conta correttamente, KanbanWidget permette drag delle card

---

## Task 7: Accessibilità WCAG 2.2 AA
**Impatto:** UX/Accessibilità | **Durata:** 3-4 ore | **Dipende da:** nessuna

23 violazioni documentate. Ordine per criticità.

### 7a. Focus trap su tutti i modali (CRITICAL)
- [ ] Creare `src/hooks/useFocusTrap.ts` — hook riutilizzabile (tab loop, restore focus on close)
- [ ] `src/components/BoardModal.tsx` — aggiungere `useFocusTrap`, `role="dialog"`, `aria-modal="true"`,
      `aria-labelledby`, autofocus su primo elemento
- [ ] `src/components/CommandPalette.tsx` — aggiungere `useFocusTrap`, `role="dialog"`, `aria-modal="true"`
- [ ] `src/components/Onboarding.tsx` — aggiungere `useFocusTrap`, `role="dialog"`, Escape handler,
      `aria-label` sul close button
- [ ] `src/components/ShortcutsModal.tsx` — aggiungere `useFocusTrap`, `role="dialog"`, `aria-modal`,
      `aria-label` sul close button

### 7b. Fix landmark nesting (CRITICAL)
- [ ] `src/App.tsx:42` e `src/components/Canvas.tsx` — `role="application"` non deve stare su `<main>`.
      Spostare su div interno al canvas, lasciare `<main>` con solo `role="main"`

### 7c. Fix contrasto colori (CRITICAL)
- [ ] `src/widgets/StickyWidget.tsx:97` — la logica `isDark` è troppo restrittiva.
      Usare `colorIsDark(content.color)` che calcola luminanza reale, forzare testo `#1a1a2e` su sfondi chiari
- [ ] `src/index.css` — `--wb-text-dimmed`: `#71717a` → `#8b8b96` (ratio 5.3:1) su dark theme

### 7d. Aggiungere aria-label su input non etichettati (ALTA)
- [ ] `src/widgets/TodoWidget.tsx` — 3 TextInput + 5 ActionIcon (remove, clear-completed, priority, add, subtask expand)
- [ ] `src/widgets/StickyWidget.tsx` — tag TextInput + remove IconX
- [ ] `src/widgets/ClockWidget.tsx` — theme Select + time input + add alarm
- [ ] `src/widgets/BoardWidget.tsx` — rename TextInput
- [ ] `src/components/Canvas.tsx:613` — zoom range input

### 7e. Aggiungere aria-live su contenuti dinamici (ALTA)
- [ ] `src/widgets/ClockWidget.tsx:170` — orologio con `aria-live="polite"` e `aria-atomic="true"`
- [ ] `src/components/CommandPalette.tsx:585` — chat AI: wrapper `aria-live="polite"` sui messaggi
- [ ] `src/widgets/CalcWidget.tsx` — display risultato con `role="status" aria-live="polite"`
- [ ] `src/widgets/TodoWidget.tsx` — barra progresso con `role="progressbar"` + `aria-valuenow/min/max`

### 7f. Resize handle accessibili (MEDIA)
- [ ] `src/components/Widget.tsx:286-309` — aggiungere `role="separator"`, `aria-label` descrittivo,
      `tabIndex={0}`, handler `onKeyDown` per spostare con frecce (Shift+Arrow per resize)

### 7g. Elementi interattivi solo-mouse resi keyboard-accessible (MEDIA)
- [ ] `src/widgets/CalcWidget.tsx:296` — history items: `tabIndex={0}`, `role="button"`, `onKeyDown` Enter
- [ ] `src/components/Onboarding.tsx:259` — template cards: `role="button"`, `tabIndex={0}`, `onKeyDown`
- [ ] `src/components/SettingsModal.tsx:108` — canvas bg cards: `role="button"`, `tabIndex`, `onKeyDown`
- [ ] `src/components/Canvas.tsx:712` — snap lines SVG: `aria-hidden="true"`

- **Verify:** Tab navigation funziona in tutti i modali, focus mai perso dietro overlay,
  screen reader annuncia cambiamenti orologio/chat/calcolatrice, input hanno label

---

## Task 8: Storybook
**Impatto:** Dev Experience | **Durata:** 1 ora | **Dipende da:** Task 5 (memo component)

- [ ] `npx storybook@latest init` — init in modalità Vite + React
- [ ] Configurare decorator globale per MantineProvider + tema dark/light
- [ ] Creare storie per 5 componenti core: Widget, Canvas (mock store), Toolbar, CommandPalette, NoteWidget
- **Verify:** `npm run storybook` parte, tutte le storie renderizzano

---

## Task 9: Widget connections (data flow)
**Impatto:** Feature | **Durata:** 2-4 ore | **Dipende da:** Task 5 (store stabile)

Permettere a un widget di mandare dati a un altro (es. click evento Calendario → apre Nota collegata).

- [ ] Creare `src/store/connectionsSlice.ts`:
  ```ts
  connections: { id, fromWidgetId, fromField, toWidgetId, toField }[]
  addConnection(c), removeConnection(id), getConnectionsForWidget(widgetId)
  ```
- [ ] Creare `src/hooks/useWidgetConnection.ts` — hook per push/consume dati da connessioni
- [ ] UI: Aggiungere sezione "Connections" nel context menu del widget (src/components/ContextMenu.tsx)
      o nella modale settings. Dropdown per selezionare widget target e campo.
- [ ] Implementare prima connessione concreta:
      CalendarWidget → NoteWidget (click evento apre nota con dettagli evento)

- **Verify:** Creare connessione Calendar→Note, cliccare evento calendario, la nota si popola con dati evento

---

## Task 10: Performance benchmarks
**Impatto:** Qualità | **Durata:** 1 ora | **Dipende da:** Task 5

- [ ] Creare `src/test/perf/benchmark.test.ts`
  - `render 100 widgets`: misurare tempo mount + FCP approssimato
  - `undo/redo su board da 200 widget`: tempo operazione
  - `resize widget mentre 100 widget sono montati`: frame drop
- [ ] Usare `performance.now()` per misurazioni
- [ ] Registrare baseline in file JSON (`src/test/perf/baseline.json`)
- [ ] Aggiungere script `npm run test:perf`
- **Verify:** `npm run test:perf` stampa risultati e confronta con baseline

---

## Task 11: Changelog automatico
**Impatto:** Infrastruttura | **Durata:** 30 min | **Dipende da:** nessuna

- [ ] Installare `standard-version`: `npm install --save-dev standard-version`
- [ ] Aggiungere script `"release": "standard-version"` in `package.json`
- [ ] Configurare `.versionrc.json` con regole custom per conventional commits
- [ ] Aggiornare `.github/workflows/deploy.yml` con step opzionale di release
- **Verify:** `npx standard-version --dry-run` produce changelog dai commit esistenti

---

## Ordine di esecuzione

```
Day 1:  1→2→5 (LICENSE + AI env + Performance — massimo impatto su UX)
Day 2:  4 (Test coverage — previene regressioni)
Day 3:  7 (Accessibilità — 23 fix, molti piccoli e indipendenti)
Day 4:  3→6 (IndexedDB + Timer + Kanban — feature nuove)
Day 5:  8→10→11→9 (Storybook + Perf + Changelog + Connections — infrastruttura finale)
```

Le tasks sono largamente indipendenti (tranne 8→5, 9→5) quindi si possono parallelizzare.
