# GreenLens Cameroon Project Breakdown

## 1. Project Overview
**GreenLens Cameroon** is a full-stack, offline-capable progressive web application (PWA) and authorized portal tailored for Ecological Rangers and Citizen Scientists. Its primary purpose is to allow users to document environmental observations, manage ecological campaigns, catalog environmental data, and track user contributions in Cameroon—even when internet connectivity is unstable or completely unavailable.

---

## 2. Architecture & Tech Stack

### Frontend (Client-Side)
-   **Core Framework**: React 18, utilizing functional components and hooks.
-   **Build Tool**: Vite (blazing fast frontend build and dev server).
-   **Styling**: Tailwind CSS for responsive, mobile-first utility classes and custom animations.
-   **Routing**: Single-page application structure natively rendering dynamic views based on state management within `App.tsx` and custom navigation components.
-   **Offline Resilience**: Local browser storage (`localStorage`) is extensively utilized to aggressively cache administrative registries, catalogs, and offline reports when the network drops.

### Backend (Server-Side)
-   **Server Engine**: Node.js with **Express v4**.
-   **Deployment Strategy (Vercel Serverless)**: The Express application is exported as a promise and wrapped entirely within a Serverless Function (`api/index.ts` & `vercel.json`). This serverless backend connects dynamically to the frontend for seamless API routing.
-   **Generative AI Integration**: Powered by the custom `@google/genai` TypeScript SDK (accessible securely via `server.ts`).
-   **Database**: **Supabase (PostgreSQL)** serves as the durable backend database and provides the Authentication fabric (Email/Password & Google OAuth).

---

## 3. Detailed Component Breakdown

### A. Frontend Structure (`/src`)
1.  **`main.tsx` & `index.html`**: The application's core rendering entry node.
2.  **`App.tsx`**: The orchestrator of the frontend. It manages top-level application states including:
    -   Network connectivity detection (`isOfflineMode` checks utilizing `navigator.onLine` and `window.addEventListener`).
    -   Dynamic layout swapping (Welcome screens vs. Authenticated Dashboard vs. Offline fallback banners).
    -   Global data synchronization (`refreshPlatformData`).
3.  **`components/AuthPage.tsx`**: Handles user authentication for both "Ranger Email Credentials" (Email/Password) and standard "Google Sign-In". Contains logic to detect if the Supabase environment is correctly configured or if the app is currently running in a simulated fallback state. 
4.  **`supabaseClient.ts/js`**: An abstraction layer that dynamically fetches the Supabase URL and Anon Key from the backend `/api/supabase-config` route. This hides explicit API keys from hardcoded frontend bundles.

### B. Backend Structure (`server.ts`, `/api`)
-   **`server.ts`**: Contains all critical application logic and REST APIs. Some major routes include:
    -   `/api/organizations`: Fetches/Syncs registered environmental agencies.
    -   `/api/user-stats`: Retrieves the Ecological Ranger's current EXP, level ("Observer", "Citizen Scientist", etc.), and impact scores (e.g., Carbon Footprint mappings).
    -   `/api/supabase-config`: Supplies environment variables selectively to the initialized frontend client.
    -   `/api/auth/register`: The manual user registration endpoints fallback (synchronizing between local mock state and Supabase Auth).
-   **`vercel.json` & `api/index.ts`**: The configuration files telling Vercel to route any traffic hitting `/api/(.*)` or `/auth/(.*)` directly to the Express server API engine over serverless, and all other routes to `index.html` for SPA navigation handling.
-   **Generative Processing (`@google/genai`)**: Intercepts complex natural language observation inputs or queries from rangers and converts them into structured ecological data entries or summaries on the backend.

---

## 4. Key Workflows & Data Flows

### Authentication Flow (Hybrid)
1.  When a user opens the app, `App.tsx` calls `checkActiveSession()` to ping Supabase via the `supabaseClient`.
2.  If Supabase returns an active session JWT, the user is immediately logged in (`greenlens_logged_in` set to `"true"`).
3.  If offline, the system defaults to checking `localStorage` to see if previous offline-enabled credentials still reside.

### Offline "Local-First" Fallback Strategy
Because the app is designed for "GreenLens Cameroon" (frequently deployed to remote or low-bandwidth areas), it relies heavily on a fallback schema:
-   **Network Error Detection**: If a fetch request to `/api/organizations` or `/api/user-stats` fails (non-200 connection), `App.tsx` intercepts the failure.
-   **Cache Extraction**: The app triggers a fallback loop, retrieving the stringified JSON data of `greenlens_catalogs`, `greenlens_organizations`, and `greenlens_userstats` from `localStorage`. 
-   **Visual Warning**: `showOfflineBanner` triggers an orange sticky banner informing the user: *"Running offline or Netlify serverless proxy disconnected. Viewing cached fallback catalogs."*

### Database Read/Write Flow
1. **Creation**: An Ecological Ranger submits a new report on the UI.
2. **Transit**: The UI sends an HTTP POST request to the Express layer inside `/api/`.
3. **Execution**: Express validates parameters, connects to Supabase via `getSupabase()`, updates the corresponding table (e.g., `catalogs`, `campaigns`, `observations`), and alters metrics like `active_campaigns_count`.
4. **Conclusion**: The UI successfully refreshes the relevant cached object.

---

## 5. Security & Environment Variables
The application follows strict full-stack separation of secrets to prevent API leakage:
-   **Backend Access**: The `process.env.SUPABASE_URL` and `process.env.SUPABASE_ANON_KEY` are secured on Vercel's Edge/Serverless Environment. 
-   **Browser Access**: Kept sanitized and loaded "just-in-time" from `/api/supabase-config` ensuring the `Anon Key` limits writes cleanly based on Supabase's integrated PostgreSQL Row Level Security (RLS) rules.

---

## 6. How to Export this Document as a PDF
To save this complete breakdown as a PDF on your device:
1. Open this Markdown file (`GREENLENS_PROJECT_BREAKDOWN.md`) in your code editor or browser.
2. If using **VS Code**: Install a simple extension like *Markdown PDF*, open this file, right-click, and select **Markdown PDF: Export (pdf)**.
3. If using **Chrome / Browser Edge**: Go to any online Markdown-to-PDF converter, paste this text, and print to PDF. Or read the rendered preview in the AI Studio chat and hit `Ctrl + P` (or `Cmd + P` on Mac) and select **Save as PDF** from your print dialogue.
