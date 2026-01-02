---
description: 'Next.js + Tailwind development standards and instructions'
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css'
---

# Next.js + Tailwind Development Standards

Guidelines for building high-quality **Next.js applications** with **Tailwind CSS**, **TypeScript**, and **Shadcn UI**.

---

## 📌 Project Context
- **Framework:** Next.js (latest, App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (with dark mode)
- **UI Components:** Shadcn UI
- **Validation:** Zod for runtime validation

---

## 🏗 Architecture
- Use **App Router** with server and client components.
- Group routes by **feature/domain** for modularity.
- Implement **error boundaries** for resilience.
- Prefer **React Server Components (RSCs)** by default.
- Use **static optimization** where possible for performance.

---

## 📝 TypeScript
- Enable **strict mode** in `tsconfig.json`.
- Define **clear interfaces and types** for all props and data models.
- Use **type guards** for safe runtime checks.
- Apply **Zod schemas** for input validation at runtime.

---

## 🎨 Styling
- Tailwind CSS with a **consistent color palette** (use config).
- Responsive design using **flex, grid, and container queries**.
- **Dark mode support** with Tailwind’s `dark:` variant.
- Maintain **semantic HTML** for accessibility and SEO.

---

## 🔄 State Management
- Use **React Server Components** for server state.
- Use **React hooks** (`useState`, `useReducer`, `useContext`) for client state.
- Always implement **loading and error states**.
- Support **optimistic UI updates** when mutating data.

---

## 📡 Data Fetching
- Use **Server Components** for direct DB queries when possible.
- Use **React Suspense** for async boundaries.
- Add **error handling with retries** for unstable APIs.
- Follow **cache invalidation strategies** for client/server sync.

---

## 🔒 Security
- Validate and sanitize **all inputs** (server + client).
- Enforce **authentication and authorization checks**.
- Protect APIs with **CSRF tokens** and **rate limiting**.
- Handle secrets securely with **environment variables**.

---

## ⚡ Performance
- Use `next/image` for image optimization.
- Use `next/font` for **self-hosted font optimization**.
- Enable **route prefetching** for faster navigation.
- Apply **code splitting** for heavy modules.
- Monitor and reduce **bundle size**.

---

## ♿ Accessibility
- Use semantic HTML (`<button>`, `<nav>`, `<main>`).
- Provide **alt text** for all images.
- Ensure **keyboard navigation** works everywhere.
- Apply **ARIA attributes** where necessary.

---

## 🧪 Testing
- Unit tests with **Jest** or **Vitest**.
- Component tests with **React Testing Library**.
- End-to-end (E2E) tests with **Playwright** or **Cypress**.
- Add **CI integration** for automated test runs.

---

## 📖 Documentation
- Write **JSDoc/TSDoc comments** for functions and components.
- Maintain a **README.md** for each feature/module.
- Add architectural decisions to an **ADR log**.
- Keep API routes documented in **OpenAPI/Swagger** (if applicable).

---

## 🎯 App Objectives
- Provide a **seamless user experience**.
- Ensure **high performance and accessibility**.
- Maintain **consistent code quality**.
- Encourage **scalable and maintainable architecture**.

---

## 🚀 Implementation Process
1. Plan **component hierarchy**.
2. Define **types and interfaces**.
3. Implement **server-side logic** (RSCs, APIs).
4. Build **client components**.
5. Add **error handling** (boundaries, fallback UI).
6. Implement **responsive styling** with Tailwind.
7. Add **loading states** with Suspense/spinners.
8. Write **unit, integration, and E2E tests**.
9. Update **documentation**.

---
