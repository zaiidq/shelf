# Shelf

A free personal page at `your-site/username` that shows who you are through what you love: your
ranked favorite films, shows, books and music, plus what you're into right now. Made for your
Instagram/TikTok bio.

The full product brief is in [`CLAUDE.md`](CLAUDE.md). Design mockups are in
[`docs/design/`](docs/design/).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript (strict) + Tailwind CSS
- [Supabase](https://supabase.com): Postgres database, auth, file storage
- Deployed on Vercel (later)

## Run it locally

You need [Node.js 22 LTS](https://nodejs.org).

```bash
npm install
npm run dev
```

Open http://localhost:3000. The demo profile is at http://localhost:3000/zaid.

Without any setup the app runs on bundled demo data. To use a real database, connect Supabase
(below).

## Connect Supabase

1. Create a free project at [supabase.com](https://supabase.com) (pick a region near your users and
   save the database password).
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project Settings → Data API → Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Project Settings → API Keys → publishable key
   - `SUPABASE_SECRET_KEY`: Project Settings → API Keys → secret key (server only, never share it)
3. Create the tables:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --remote
   ```
   Your project ref is the part after `/project/` in the dashboard URL.
4. Load the demo profile: open **SQL Editor** in the Supabase dashboard, paste the contents of
   `supabase/seed.sql`, and click **Run**.
5. Restart `npm run dev`.

## Useful commands

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Start the dev server at http://localhost:3000           |
| `npm run build`    | Production build                                        |
| `npm run check`    | Type check + lint + formatting check                    |
| `npm run format`   | Auto-format all files                                   |
| `npm run db:types` | Regenerate `src/types/database.ts` from linked Supabase |

## Project layout

```
src/app/            pages and layouts (Next.js App Router)
src/components/     UI components
src/lib/            shared code: env, Supabase clients, data loading
src/types/          generated database types
supabase/           database migrations and demo seed data
docs/design/        reference mockups
```
