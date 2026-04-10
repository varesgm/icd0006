# AI-Assisted Development

Since my prompts for creating A1 using Kilo Code were lost from earlier, this document only has records of AI prompts used during the migration of the Task Manager from vanilla JavaScript to strict TypeScript for A2, including what was suggested, what was adopted, and key decisions made.

---

## Prompt 1: Migration Architecture Planning

**Prompt:**
```
I have a vanilla JavaScript task manager with 3 files (app.js, storage.js, validator.js). I need to migrate it to TypeScript with strict mode.
```

**AI Response Summary:**
- Suggested directory structure: `src/` with `types/`, `utils/`, and module files
- Recommended switching from global-scope `<script>` tags to ES module imports with a single `<script type="module" src="/src/main.ts">` entry point
- Advised creating a separate entry point (`main.ts`) to keep the TaskManager class importable

**Decision:** Created the `src/` directory structure as suggested.

---

## Prompt 2: Core Type Definitions

**Prompt:**
```
Create TypeScript interfaces and types for my task manager entities
```

**AI Response Summary:**
- Generated union types for `TaskStatus` and `TaskPriority`
- Created `RecurrenceSchedule` interface with `RecurrenceFrequency` type
- Defined `Category` interface as a separate entity
- Created `PRIORITY_ORDER` and `STATUS_ORDER` as `Record<Type, number>` constant maps
- Added `STATUS_LABELS` for display strings (`PRIORITY_LABELS` was later removed as unused)
- Defined `TaskFilterState`, `SortState`, `TaskStatistics`, and `StorageInfo` interfaces

**Decision:** Used union types + constant maps instead of TypeScript `enum`. This is more idiomatic in modern TS — enums generate runtime code while union types are erased at compile time. The constant maps provide the same lookup functionality.

---

## Prompt 3: Generic Utility Functions

**Prompt:**
```
Write generic TypeScript utility functions for the task manager.
They should be type-safe, reusable across different types, and demonstrate TypeScript generics.
```

**AI Response Summary:**
- `filterBy<T>(items, predicate)` — wraps `Array.filter` with generic typing
- `sortBy<T>(items, keyFn, direction)` — non-mutating sort with null handling, supports string (localeCompare) and number comparisons, optional 'asc'/'desc' direction

**Decision:** Adopted `filterBy` and `sortBy`, which replaced manual `.filter()` and `.sort()` chains in `getFilteredTasks()`.
---

## Prompt 4: Storage Module Migration

**Prompt:**
```
Migrate my storage class to TypeScript strict mode. Type all methods with proper return types
```

**AI Response Summary:**
- Typed all class properties: `db: IDBDatabase | null`, `useIndexedDB: boolean`
- Typed all methods: `getAllTasks(): Promise<Task[]>`, `saveTask(task: Task): Promise<Task>`
- Implemented `onupgradeneeded` with conditional index creation for existing stores
- Created full Category CRUD methods mirroring the Task pattern
- Extended `migrateTask()` to handle `completed → done` and set defaults for new fields
- Used `Record<string, unknown>` as input type for `migrateTask()` to handle untyped legacy data

**Decision:** The conditional index creation in `onupgradeneeded` was important — it handles both fresh installs (create everything) and upgrades from v1 (add only new indexes). The `migrateTask` approach of accepting `Record<string, unknown>` and returning `Task` is a clean pattern for handling untyped stored data.

---

## Prompt 5: Statistics Module

**Prompt:**
```
Create a statistics module that computes:
Tasks by status/priority,
Overdue task count,
Completion as percentage,
Tasks per category,
Only include non-deleted (soft-deleted) tasks in calculations.
```

**AI Response Summary:**
- Created `computeStatistics()` function accepting `Task[]` and `Category[]`
- Returns `TaskStatistics` interface with all computed fields
- Excludes soft-deleted tasks from all calculations
- Excludes cancelled tasks from the completion rate denominator
- Includes an 'uncategorized' entry for tasks without a category

**Decision:** Made this a pure function rather than a class — it has no state and just transforms data. The function is called from `renderStats()` in the TaskManager on every render cycle.

---

## Prompt 6: Main Application Migration

**Prompt:**
```
Migrate the TaskManager class to TypeScript strict mode. Type all class properties
```

**AI Response Summary:**
- Typed all DOM element references with `HTMLFormElement`, `HTMLInputElement`, etc.
- Used definite assignment assertions (`!`) for elements assigned in `bindElements()`
- Replaced all inline `onclick`/`onchange` with event delegation on `taskList` using `closest()` for traversal
- Created filter state as a single `TaskFilterState` object instead of separate properties
- Integrated `filterBy<Task>()` and `sortBy<Task>()` generics in the filter pipeline
- Added full category management: `handleAddCategoryFromInput()`, `handleDeleteCategory()`, `renderCategorySelects()`, `renderCategoryFilter()`

**Decision:** Event delegation was a significant improvement — it eliminated the need for `window.taskManager` as a global variable, which is incompatible with ES modules. The `TaskFilterState` interface consolidates 6 separate filter properties into one typed object, making the state management cleaner.

---

## Prompt 7: Seed Data for Development Testing

**Prompt:**
```
Create seedings for testing purposes, that can also be easily removed when needed.
```

**AI Response Summary:**
- Created `src/seed.ts` with `seedDatabase(storage)` and `clearSeedData(storage)` functions
- Seed data covers all testable scenarios: 5 categories, 20 tasks spanning all 4 statuses, all 4 priorities, overdue/today/future/null due dates, tasks with tags, no tags, no category, parent-child dependencies, a recurring task, and a soft-deleted task
- Used fixed ID strings (`seed-cat-001`, `seed-task-01`, etc.) so seeding is idempotent — re-running overwrites rather than duplicates
- Exposed via `window.seed()` and `window.clearSeed()` in dev mode using `import.meta.env.DEV`
- Made `TaskStorage` property public on `TaskManager` so `main.ts` can pass it to the seed functions

**Decision:** Browser-only app means seeding must happen in the browser context. Exposing helpers on `window` only in dev mode keeps them out of production builds. Using fixed IDs makes the seed safe to run multiple times.

---

## Prompt 8: Light/Dark Mode Toggle

**Prompt:**
```
Add a light/dark mode toggle button instead of automatically only using OS preference.
```

**AI Response Summary:**
- The app already had `@media (prefers-color-scheme: dark)` and CSS custom properties — the infrastructure was 90% in place
- Added `[data-theme="dark"]` and `[data-theme="light"]` selectors on `<html>` to let a manual choice override the OS preference
- Added `initTheme()` method to `TaskManager`: reads `localStorage.theme`, falls back to `matchMedia`, applies `data-theme` attribute immediately (before render, no flash)
- Added a sun/moon toggle button in the header with hover styling
- Preference persisted to `localStorage` on each toggle

**Decision:** The `data-theme` on `<html>` pattern is the standard approach — it beats the media query in specificity without JavaScript-in-CSS hacks. Calling `initTheme()` before `showLoading()` prevents a flash of the wrong theme.

---


## Prompt 9: UI Layout Improvements

**Prompt:**
```
Make the "Add New Task" clickable instead of constantly filling the screen.
The form should be collapsed at first.
```

**AI Response Summary:**
- Made the "Add New Task" heading a clickable `<h2 class="task-form-toggle">` with a `<span class="toggle-icon">+</span>`
- The `<form>` starts with `display: none` (collapsed); the toggle handler in `bindEvents()` flips it and swaps `+` → `−`
- Added `.task-form-toggle` hover style and `.task-form-body` padding

**Decision:** Collapsing the form by default gives users immediate access to the task list without scrolling past a large empty form. The `+`/`−` icon convention is familiar and requires no additional explanation.

---

## Prompt 10: Category Management Modal

**Prompt:**
```
"Manage categories" should have a pop-up page instead of a small space in the sidebar.
Deleting them must also be an option.
```

**AI Response Summary:**
- Replaced the inline sidebar category manager (small input + Add button) with a single "⚙️ Manage Categories" button that opens a modal
- Modal lists all existing categories with a color swatch, name, and 🗑 delete button per row
- Add form inside modal: text input (properly themed with `background: var(--bg-color)` and `color: var(--text-color)`), color picker, and Add button
- `renderCategoryModal()` method added to `TaskManager` — rebuilds the list and wires delete button events
- `handleAddCategoryFromInput()` extended to read the color picker value and call `renderCategoryModal()` after adding
- `handleDeleteCategory()` was already implemented but never exposed in the UI; wired it up through the modal's delete buttons
- Removed the `confirm()` dialog from `handleDeleteCategory()` — the explicit delete button in the modal is intentional enough
- Enter key on the name input triggers add

**Decision:** A modal keeps the sidebar clean while giving the category workflow enough space. The inline input invisibility issue was a theming gap — the new modal input uses the correct CSS variables so text is always visible.

---
