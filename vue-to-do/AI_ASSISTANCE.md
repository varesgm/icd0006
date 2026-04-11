# AI Assistance

This document lists prompts that were used during the development of this project.
(Prompts have been smoothed over by AI and compacted together for better readability)

---

## TypeScript Interfaces

> I have started working on a Vue 3 project with Vite and TypeScript. I am integrating with this REST API: https://taltech.akaver.com/swagger/v1/swagger.json. Generate TypeScript interfaces for the `TodoTask`, `TodoTaskRequest`, `TodoCategory`, `TodoCategoryRequest`, `TodoPriority`, `TodoPriorityRequest`, and `JWTResponse` schemas. Place them in `src/types/index.ts`.

---

## Auth Store

> Create a Pinia store in `src/stores/auth-store.ts` using the setup store pattern (`defineStore` with a function). It should handle JWT login and registration against `POST /api/v1/Account/Login` and `POST /api/v1/Account/Register` on `https://taltech.akaver.com`. Store the JWT and refresh token in `localStorage`. Expose `isLoggedIn` as a `computed`, and `firstName`/`lastName` from the session. Use `fetch` and TypeScript.

---

## Token Refresh

> Extend my auth store with a `refresh()` method that calls `POST /api/v1/Account/RefreshToken` with the current token and refresh token. Return a boolean indicating success. Then create `src/api/client.ts` — a fetch wrapper that attaches the `Bearer` token to every request, and on a `401` response automatically calls `refresh()` and retries the request once. If the refresh fails, call `logout()` and redirect to the login route. Prevent multiple simultaneous refresh calls from triggering multiple refresh requests.

---

## Router Guards

> My router has these routes: `/` (Main), `/login`, `/register`, `/about`, and a `/:pathMatch(.*)*` catch-all. Add `meta: { requiresAuth: boolean }` to each route. Use `useAuthStore` from Pinia inside the guard.

---

## Pinia Stores for CRUD

> Create three Pinia stores using the setup pattern: `todo-store.ts`, `category-store.ts`, and `priority-store.ts`. Each should use `ref()` for state and expose fetch, add, and delete actions that call the corresponding endpoints on `https://taltech.akaver.com/api/v1/TodoTasks`, `/TodoCategories`, and `/TodoPriorities`. The todo store should also have `updateTask`. Use the `api` client from `src/api/client.ts` and the types from `src/types/index.ts`. Include `loading` and `error` state in the todo store.

---

## Login and Register Views

> Modify `LoginView.vue` and create `RegisterView.vue` in `src/views/`. LoginView takes email and password, calls `authStore.login()`, and redirects to the `?redirect` query param or `/` on success. RegisterView takes first name, last name, email, password, and confirm password with client-side match validation. Show inline error messages.

---

## Main View with Tabs

> Modify `MainView.vue` to use `useTodoStore`, `useCategoryStore`, and `usePriorityStore`. Use `storeToRefs()` to destructure reactive state from each store. The view should have tabs: Active, Done, Archived, Categories, Priorities. Active tasks can be marked done or archived. Done tasks can be reopened or archived. Archived tasks can be restored. Each tab shows an add form at the bottom. 

---

## Theme

> I want a dark theme using a yellow, white, and black colour palette. Create CSS variables and overrides for current Bootstrap's primary colour, navbar, cards, form inputs, tables, and badges. Also style a centered auth card layout for the login and register pages.

---

## Dockerfile

> Modify my Dockerfile to be multi-stage.
