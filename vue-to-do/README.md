# TodoVue

A Vue 3 task manager app built (originally) against the [TalTech backend](https://taltech.akaver.com).

**Live app (against https://taltech.akaver.com/):** https://grvare-vue-to-do.proxy.itcollege.ee/

**Live app (against https://grvare-express-js.proxy.itcollege.ee/):** https://grvare-vue-express.proxy.itcollege.ee/

---

## Features

- Register and log in with email and password
- JWT-based authentication with automatic token refresh
- Create, complete, reopen, archive, restore, and delete tasks
- Assign due dates, categories, and priorities to tasks
- Manage categories and priorities in dedicated tabs
- Overdue task highlighting
- Persistent login across page reloads
- SPA fallback in nginx for direct navigation to Vue Router routes

---

## Tech Stack

| | |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript |
| State | Pinia with `storeToRefs` |
| Routing | Vue Router with navigation guards |
| Styling | Bootstrap 5 + custom yellow/black theme |
| Build | Vite |
| Backend | https://taltech.akaver.com by default, configurable with `VITE_API_BASE_URL` |

---

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm

### Install dependencies

```sh
npm install
```

### Configure environment

The `.env` file is already included with the default backend URL:

```env
VITE_API_BASE_URL=https://taltech.akaver.com
```

Only `VITE_API_BASE_URL` is used by the app. To point the app at another backend, change that value before starting the dev server or building for production.

### Run in development

```sh
npm run dev
```

App will be available at `http://localhost:5173`.

### Build for production

```sh
npm run build
```

Output goes to `dist/`.

### Other scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test:unit` | Run unit tests with Vitest |
| `npm run lint` | Lint and auto-fix with ESLint + oxlint |
| `npm run format` | Format source files with Prettier |

---

## Docker

The app is served via nginx inside a Docker container. The Dockerfile uses a multi-stage build: Node builds the Vite app, nginx serves the output, and `nginx.conf` falls back to `index.html` for Vue Router paths.

Build and run:

```sh
docker compose up --build -d
```

The compose file defines two deployments:

| Service | Backend | Local URL |
|---|---|---|
| `web` | `https://taltech.akaver.com` | http://localhost:82 |
| `web-grvare` | `https://grvare-express-js.proxy.itcollege.ee` | http://localhost:89 |

To stop:

```sh
docker compose down
```

> `VITE_API_BASE_URL` is baked into the JS bundle at build time by Vite. Runtime server environment variables do not change the already-built frontend bundle.

The VPS deployment uses GitLab CI from `main`:

```sh
docker compose -p vue-to-do up --build --remove-orphans --detach
```

---

## Project Structure

```
src/
├── api/
│   └── client.ts          # Fetch wrapper with JWT auth + auto-refresh on 401
├── assets/
│   └── theme.css          # Yellow/white/black theme overrides
├── components/
│   └── AppHeader.vue      # Navbar with user info and logout
├── router/
│   └── index.ts           # Routes with auth guards
├── stores/
│   ├── auth-store.ts      # JWT login, register, refresh, logout
│   ├── todo-store.ts      # Task CRUD
│   ├── category-store.ts  # Category CRUD
│   └── priority-store.ts  # Priority CRUD
├── types/
│   └── index.ts           # TypeScript interfaces for all API entities
└── views/
    ├── LoginView.vue
    ├── RegisterView.vue
    ├── MainView.vue        # Active / Done / Archived / Categories / Priorities tabs
    ├── AboutView.vue
    └── NotFoundView.vue
```

---

## Security

Authentication is handled with **JWT (JSON Web Tokens)** and a **refresh token**, both issued by the backend on login or register.

- The JWT is a short-lived token sent as a `Bearer` header on every API request
- The refresh token is longer-lived and used only to obtain a new JWT when the current one expires
- Both tokens are stored in `localStorage` so the session persists across page reloads
- When any API request returns `401 Unauthorized`, `api/client.ts` automatically calls `/api/v1/Account/RefreshToken` to get a new token pair and retries the original request — this happens transparently with no user interaction
- If the refresh also fails (e.g. refresh token expired or revoked), the user is logged out and redirected to `/login`
- Multiple simultaneous 401s share a single refresh attempt to avoid race conditions

---

## Routing

Routes are defined in `src/router/index.ts` using Vue Router with eager loading. Every route has a `meta.requiresAuth` flag checked by a `beforeEach` navigation guard:

- If `requiresAuth: true` and the user is not logged in → redirect to `/login`, preserving the intended destination as `?redirect=...`
- If navigating to `/login` or `/register` while already logged in → redirect to `/`
- The catch-all 404 route and auth routes are always accessible regardless of login state

| Route | Auth required | Description |
|---|---|---|
| `/` | Yes | Main task view |
| `/login` | No | Login form |
| `/register` | No | Registration form |
| `/about` | Yes | About page |
| `/:pathMatch(.*)*` | No | 404 catch-all |

---

## AI Assistance

See [AI_ASSISTANCE.md](AI_ASSISTANCE.md) for prompts that were used to develop this project.
