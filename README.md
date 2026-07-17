# WidgetBoard &mdash; Your Infinite Canvas Dashboard

<p align="center">
  <img src="screenshot.png" alt="WidgetBoard" />
</p>

<p align="center">
  An infinite canvas where you can place, arrange, and organize 24 different
  widgets &mdash; from sticky notes and task lists to clocks, calculators, RSS
  feeds, and habit trackers. Drag, resize, group, link with arrows, and navigate
  between boards. All persisted locally in your browser.
</p>

---

## Features

- **24 Widget Types** across 7 categories &mdash; notes, todos, calendars, clocks, calculators, weather, RSS, finance, and more
- **Infinite Canvas** &mdash; pan, zoom, and scroll without bounds
- **Drag & Drop** &mdash; move and resize widgets anywhere; snap-to-grid and collision detection built in
- **Undo / Redo** &mdash; full history stack for all board operations
- **Multi-Select** &mdash; select multiple widgets with click or drag-lasso to move, group, or delete
- **Groups** &mdash; organize widgets into collapsible canvas groups
- **Canvas Elements** &mdash; draw arrows, text labels, shapes, and lines to annotate the board
- **Multi-Board** &mdash; create nested boards and navigate with breadcrumbs and minimap
- **AI Agent** &mdash; chat with a built-in assistant that can manipulate the board via natural language
- **Command Palette** &mdash; `Ctrl+K` to search, add widgets, or run commands
- **Keyboard Shortcuts** &mdash; full keyboard-driven workflow (open with `?`)
- **Dark / Light Mode** &mdash; toggle themes
- **Persistence** &mdash; everything saves automatically to `localStorage`
- **Import / Export** &mdash; backup and restore your boards as JSON
- **Progressive Web App** ready &mdash; mobile-responsive with PWA meta tags

## Widget Types

| Category       | Widgets                                                        |
| :------------- | :------------------------------------------------------------- |
| Productivity   | Note, Tasks, Calendar, Pomodoro, Sticky, Pomodoro Stats, Habits |
| Time           | Clock, World Clock, Countdown                                  |
| Media          | Image, Embed, Quote                                            |
| Utilities      | Search, Calculator, Clipboard, Snippets, Palette, Weather      |
| Organization   | Link, Board, Bookmarks                                         |
| Finance        | Expenses                                                       |
| Data           | RSS Feed                                                       |

## Tech Stack

| Layer           | Technology                                                    |
| :-------------- | :------------------------------------------------------------ |
| Framework       | [React 19](https://react.dev)                                 |
| Language        | [TypeScript 6](https://www.typescriptlang.org)                |
| Build           | [Vite 8](https://vite.dev)                                    |
| UI Library      | [Mantine 9](https://mantine.dev)                              |
| State           | [Zustand 5](https://zustand.docs.pmnd.rs)                     |
| Drag & Drop     | [dnd-kit](https://dndkit.com)                                 |
| Icons           | [Tabler Icons](https://tabler.io/icons)                       |
| Linting         | [oxlint](https://oxc.rs)                                      |
| Formatting      | [Prettier](https://prettier.io)                               |
| Testing         | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| AI              | [page-agent](https://www.npmjs.com/package/page-agent)        |
| Math            | [math-expression-evaluator](https://www.npmjs.com/package/math-expression-evaluator) |
| Markdown        | [react-markdown](https://github.com/remarkjs/react-markdown)  |
| Git Hooks       | [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+ and npm

### Install & Run

```bash
# Clone the repository
git clone https://github.com/giorgiomencarelli/widgetboard.git
cd widgetboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173/widgetboard/` in your browser.

### Build for Production

```bash
npm run build     # type-check and build
npm run preview   # preview the production build locally
```

## Scripts

| Command            | Description                                  |
| :----------------- | :------------------------------------------- |
| `npm run dev`      | Start Vite development server with HMR       |
| `npm run build`    | Type-check with `tsc` then build with Vite   |
| `npm run preview`  | Preview the production build                 |
| `npm run lint`     | Run oxlint                                   |
| `npm run lint:fix` | Run oxlint with auto-fix                     |
| `npm run format`   | Format all files with Prettier               |
| `npm run format:check` | Check formatting with Prettier           |
| `npm test`         | Run Vitest once                              |
| `npm run test:watch` | Run Vitest in watch mode                   |
| `npm run test:coverage` | Run Vitest with coverage report         |

## Project Structure

```
widgetboard/
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx              # App entry point, Mantine/MUI provider
│   ├── App.tsx               # Root: Canvas + Toolbar + CommandPalette + AgentPanel
│   ├── theme.ts              # Mantine theme config (dark/light)
│   ├── index.css             # Global styles
│   ├── components/           # React components (Toolbar, Canvas, Minimap, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand store slices (widget, board, canvas, history, etc.)
│   ├── tools/                # Canvas tools (pointer, select, drag, etc.)
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── widgets/              # Widget registry + individual widget components
│   └── test/                 # Test setup and helpers
```

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run `npm run lint:fix` and `npm test`
5. Submit a pull request

For bug reports and feature requests, open an issue on GitHub.

## License

[MIT](LICENSE)
