# Task Manager — TypeScript

A browser-based task management application built with strict TypeScript, featuring recurring tasks, task dependencies, categories, real-time statistics, and light/dark mode.

## Opening the hosted website

Open the following URL in a browser:
https://grvare-taskmanager.proxy.itcollege.ee/

## Tech Stack

- **TypeScript 5.4** — strict mode enabled, no implicit any
- **Vite 5.4** — dev server with HMR, production builds
- **IndexedDB / localStorage** — dual storage with automatic fallback
- **No frameworks** — pure TypeScript with DOM APIs

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server with HMR |
| `build` | `npm run build` | Type-check + production build |
| `preview` | `npm run preview` | Preview production build |

## Project Structure

```
task-manager/
├── index.html                 # Entry HTML (loads /src/main.ts as module)
├── styles.css                 # Responsive CSS with light/dark mode support
├── tsconfig.json              # TypeScript strict config
├── vite.config.ts             # Vite build config
└── src/
    ├── main.ts                # Entry point; exposes window.seed() in dev
    ├── app.ts                 # TaskManager class (main controller)
    ├── storage.ts             # IndexedDB/localStorage abstraction
    ├── seed.ts                # Dev seed data (20 tasks, 5 categories)
    ├── validator.ts           # Input validation with XSS prevention
    ├── recurrence.ts          # Recurring task logic
    ├── statistics.ts          # Statistics computation
    ├── types/
    │   ├── task.ts            # Core interfaces, types, constants
    │   └── validation.ts      # Validation result types
    └── utils/
        └── generic.ts         # Generic utility functions
```

## Features

### Core CRUD
- Create, read, update, and soft-delete tasks
- Form validation with sanitization (XSS prevention)
- Toast notifications for all operations

### Recurring Tasks
- Mark a task as recurring with frequency (daily/weekly/monthly/yearly) and interval
- When a recurring task is marked "Done", the system auto-generates the next instance with an updated due date
- Recurrence stops when past the optional end date

### Task Dependencies
- Assign a parent task via the "Parent Task" dropdown
- A child task **cannot be marked "Done"** until its parent task is completed
- Dependency relationships are displayed on task cards

### Categories (Entity Relationship)
- **Category 1..* Task** — One category has many tasks
- Manage categories via a dedicated modal (⚙️ Manage Categories button in sidebar)
- Each category has a custom color, set with a color picker
- Delete a category directly from the modal — tasks become uncategorized
- Filter tasks by category
- Search covers category names

### Priority as First-Class Type
- **Task *.1 Priority** — Each task has exactly one priority
- Defined as `TaskPriority` union type with `PRIORITY_ORDER` constant map
- Four levels: critical, high, medium, low

### Search & Sorting
- Full-text search across title, description, tags, and category name
- Sort by 7 fields: title, priority, due date, created date, status, category, or composite default
- Combined filter + sort in a single query

### Filtering
- Filter by status: All, Pending, In Progress, Done, Cancelled
- Filter by priority: Critical, High, Medium, Low
- Filter by category (dynamic buttons)
- Filter by tags (dynamic buttons from task data)
- Filter by date range (from/to date inputs)
- All filters combine independently

### Statistics
- Tasks by status (count)
- Tasks by priority (count)
- Overdue task count
- Completion rate (%)
- Tasks per category

### Light/Dark Mode
- Follows OS preference (`prefers-color-scheme`) by default
- Manual toggle button (☀️/🌙) in the header overrides the OS preference
- Preference persisted in `localStorage`
- All colors defined as CSS custom properties — no hardcoded values
- Overdue task cards use a deep dark red background in dark mode

### Storage
- IndexedDB as primary storage
- localStorage as automatic fallback

### Developer Seed Data
Run `window.seed()` in the browser console (dev server only) to populate 5 categories and 20 tasks covering every testable scenario: all statuses, all priorities, overdue/today/future due dates, recurring tasks, parent-child dependencies, tags, and a soft-deleted task. Run `window.clearSeed()` to remove it.

## Task Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | UUID via `crypto.randomUUID()` |
| `title` | `string` | 1–200 characters |
| `description` | `string` | Max 2000 characters |
| `status` | `TaskStatus` | `pending` \| `in-progress` \| `done` \| `cancelled` |
| `priority` | `TaskPriority` | `low` \| `medium` \| `high` \| `critical` |
| `dueDate` | `string \| null` | ISO date (YYYY-MM-DD) |
| `tags` | `string[]` | Max 20 tags, each max 50 chars |
| `categoryId` | `string \| null` | FK to Category |
| `parentTaskId` | `string \| null` | FK to parent Task (dependency) |
| `isRecurring` | `boolean` | Whether task recurs |
| `recurrence` | `RecurrenceSchedule \| null` | Frequency, interval, endDate |
| `isDeleted` | `boolean` | Soft delete flag |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |
| `completedAt` | `string \| null` | ISO timestamp |

## Generic Utility Functions

Two type-safe generic functions in `src/utils/generic.ts`:

```typescript
filterBy<T>(items: T[], predicate: (item: T) => boolean): T[]
sortBy<T>(items: T[], keyFn: (item: T) => string | number | null | undefined, direction?: 'asc' | 'desc'): T[]
```

Used throughout the application for filtering tasks and sorting results.
Two instead of three because there was not a real need for another one.

## Architecture

```
                    ┌─────────────┐
                    │   main.ts   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ TaskManager │ ← app.ts (main controller)
                    └──┬───┬───┬──┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          ▼                ▼                ▼
   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐
   │ TaskStorage │ │TaskValidator│ │  statistics   │
   └─────────────┘ └─────────────┘ └──────────────┘
          │                              │
          ▼                              ▼
   ┌─────────────┐              ┌──────────────┐
   │  IndexedDB  │              │  recurrence  │
   │ localStorage│              └──────────────┘
   └─────────────┘

   Types: task.ts, validation.ts
   Utils: generic.ts (filterBy, sortBy)
```

## Entity Relationships

```
Category ──1────*── Task ──*────1── Priority
                     │
                     └── parentTaskId ──► Task (dependency)
```

## Browser Compatibility

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+
