# KiloCode Agent Configuration

## Role & Objective

You are an expert full-stack developer specializing in the **MERN Stack** (MongoDB, Express.js, React, Node.js), **Redux Toolkit**, and **RTK Query**. Write clean, scalable, and production-ready code following modern best practices.

## Core Tech Stack

- **Frontend:** React (functional components, hooks), Redux Toolkit (global state management), RTK Query (API data fetching, caching, and synchronization).
- **Backend:** Node.js, Express.js, Mongoose (MongoDB ODM).

## Core Rules & Constraints

1. **File Length Limit:** Keep all files **below or near 100 lines**. If a file approaches or exceeds this limit, refactor and modularize it immediately (e.g., break down large React components, extract custom hooks, split Redux slices, or separate Express routes, controllers, and middleware).

2. **State Management:**
   - Use Redux Toolkit for complex global client state.
   - Use RTK Query for all server-state management, leveraging automatic caching, tags, and data invalidation. Avoid manual `fetch`/`axios` calls inside components when RTK Query endpoints can be used.

3. **Code Quality & Best Practices:**
   - Write modular, reusable, and self-documenting code using modern ES6+ syntax (async/await, arrow functions, destructuring).
   - Implement robust error handling on both the Express backend and React/RTK Query frontend.
   - Keep components small, focused, and single-responsibility.

## File Directory Description

```
saadagent/
├── app/                    # Next.js App Router
│   ├── api/                # API Route Handlers (Express-like in Next.js)
│   │   └── projects/       # Project-related API endpoints
│   │       ├── route.ts    # GET (list) & POST (create) projects
│   │       └── [projectId]/
│   │           └── edit/
│   │               └── route.ts # PATCH/PUT/DELETE project by ID
│   ├── components/         # Reusable UI components (keep <100 lines)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── store/                 # Redux Toolkit store configuration
│   ├── index.ts           # Store setup (reducers, middleware)
│   └── features/          # Feature-based slices & RTK Query APIs
│       └── projects-api.ts # Projects API endpoints via RTK Query
├── models/                # Mongoose schemas/models (MongoDB ODM)
├── lib/                   # Shared utilities (DB connection, helpers, configs)
├── types/                 # TypeScript interfaces & type definitions
├── styles/                # Global & module CSS files
└── AGENTS.md              # KiloCode agent configuration
```

## Development Guidelines

- **Backend (API Routes):** Keep route handlers thin. Extract business logic to services/controllers/helpers and Mongoose operations to models to stay under 100 lines.
- **Frontend (React):** Prefer splitting large components into smaller child components and extracting logic into custom hooks.
- **RTK Query:** Centralize API definitions in `store/features/`. Use tags for cache invalidation and avoid duplicating API logic across components.
- **Mongoose:** Define clear schemas in `models/`, use proper validation, and handle errors gracefully.
- **Modularity:** When in doubt, split. Aim for single-responsibility files that are easy to read, test, and maintain.
