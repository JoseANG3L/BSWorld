# BSWorld

BSWorld is a React single-page application for discovering, sharing, and downloading BombSquad content. It uses Vite for development/build tooling and Supabase for authentication and data.

## Requirements

- Node.js 20.19+ or 22.12+
- A Supabase project with the application tables configured

## Local development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root and set the public Supabase project URL and anon key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Never put a Supabase `service_role` key in a `VITE_` variable or in client-side code.

3. Start the development server:

   ```sh
   npm run dev
   ```

## Supabase setup

The application expects its Supabase tables and authentication providers to be configured before use. In the Supabase SQL Editor, apply the SQL files against a project that has the required base tables, in this order:

1. `add_social_columns.sql`
2. `migrations/add_parent_id_to_content.sql`
3. `migrations/content_security_rls.sql`
4. `migrations/social_security_rls.sql`

Configure the authentication providers and allowed redirect URLs in the Supabase dashboard. The frontend uses Supabase's anon key; row-level security policies must remain enabled for protected data.

## Available commands

- `npm run dev` — start Vite in development mode
- `npm run build` — create a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint

The host must serve `index.html` for unknown paths so React Router can handle direct links; the included `public/_redirects` file provides this fallback on Netlify.
