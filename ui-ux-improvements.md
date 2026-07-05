# WidgetBoard UI/UX Improvement Plan

## Goal
Transform WidgetBoard from a functional infinite canvas into a polished, premium dashboard experience with smooth animations, better visual hierarchy, and refined microinteractions.

## Design System
- **Style:** Dark Mode (OLED-inspired) with violet accent
- **Typography:** Inter (existing) - keep, but improve weight hierarchy
- **Effects:** Minimal glow, smooth transitions, glassmorphism refinement
- **Principle:** Every interactive element must have hover/focus/active states

## Tasks

### Phase 1: Animation & Microinteractions
- [x] Task 1: Add CSS animation tokens to index.css (transition speeds, easing, reduced-motion)
- [x] Task 2: Widget enter/exit animation (scale + opacity)
- [x] Task 3: Widget hover lift effect (subtle shadow + translate)
- [x] Task 4: Toolbar glassmorphism refinement (inner border, better blur)

### Phase 2: Widget Improvements
- [x] Task 5: TodoWidget - add progress bar + "Clear completed" button
- [x] Task 6: StickyWidget - larger color picker (24px) + hover ring
- [x] Task 7: CalendarWidget - weekend styling + hover states + today prominence
- [x] Task 8: PomodoroWidget - better visual states (work=blue, break=green, idle=gray)

### Phase 3: Canvas & Navigation
- [x] Task 9: Widget menu search/filter
- [x] Task 10: Context menu - add "Bring to Front" / "Send to Back"
- [x] Task 11: Canvas controls - zoom slider replacing text-only percentage

### Phase 4: Polish
- [x] Task 12: Onboarding - animated entrance + better visual design
- [x] Task 13: WidgetHeader - add widget type icon + improve spacing
- [x] Task 14: Global scrollbar + focus ring styles

## Done When
- All widgets have hover/active states
- Animations respect prefers-reduced-motion
- Todo has progress bar
- Widget picker has search
- Context menu has reordering options
- Onboarding has smooth entrance animation
- Build succeeds with `npm run build`
