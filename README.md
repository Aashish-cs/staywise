# StayWise

StayWise is a senior design project for an AI-assisted short-term rental marketplace. Guests can search real database listings, save places, reserve stays, and receive explainable recommendations. Hosts can publish listings and view reservation demand.

## Tech Stack

- Next.js, React, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, Storage, Row Level Security
- Resend SMTP for production-style auth emails
- Vercel for deployment
- Explainable recommendation scoring with an optional LLM layer later

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Auth screens compile without secrets, but real sign-up, email confirmation, password reset, listings, favorites, and reservations require Supabase environment variables.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Resend is configured inside Supabase as a custom SMTP provider. Do not put the Resend API key in browser-visible environment variables.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Run `supabase/phase2_seed.sql` to add synthetic marketplace listings for demo search and reservations.
4. Turn on email confirmation in Supabase Auth settings.
5. Configure custom SMTP with Resend.
6. Add `http://localhost:3000/auth/callback` and the Vercel production callback URL to Supabase redirect URLs.

The seed listings are synthetic StayWise data with public stock imagery. Do not scrape Airbnb or copy private marketplace content into this database.

## Useful Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment

Use GitHub as the source repository and import it into Vercel. Add the same environment variables in Vercel Project Settings. The database, auth, email, seed data, and deployment setup is documented in `docs/deployment.md`.

## Project Scope

The current implementation covers authentication, Supabase-backed listing search, explainable AI ranking, guest reservations, persisted favorites, and a host listing dashboard. Payment processing, guest-host messaging, reviews, advanced adaptive learning, native mobile apps, and calendar sync remain future items per the SRS.
