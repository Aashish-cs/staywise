# StayWise

StayWise is a senior design project for an AI-assisted short-term rental marketplace. Guests can search for stays, create trip preferences, save listings, and receive explainable recommendations. Hosts can manage listings, availability, pricing, and reservation demand.

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

Auth screens compile without secrets, but real sign-up, email confirmation, password reset, and protected account data require Supabase environment variables.

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
3. Turn on email confirmation in Supabase Auth settings.
4. Configure custom SMTP with Resend.
5. Add `http://localhost:3000/auth/callback` and the Vercel production callback URL to Supabase redirect URLs.

## Useful Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment

Use GitHub as the source repository and import it into Vercel. Add the same environment variables in Vercel Project Settings. The database, auth, email, and deployment setup is documented in `docs/deployment.md`.

## Project Scope

The current implementation focuses on the September 2026 milestone: a polished web foundation with authentication, listing search, and explainable recommendation logic. Payment processing, guest-host messaging, reviews, advanced adaptive learning, native mobile apps, and calendar sync remain future items per the SRS.
