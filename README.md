# NUDGEE — Campus Influence

> Turning Positive Influence into the Strongest Peer Pressure.

NUDGEE is an AI-powered campus influence PWA that helps students navigate peer pressure, track wellness, join clubs and events, connect with mentors, and report anonymous pressure experiences — all backed by a Supabase database and a Groq-powered AI edge function.

## Features

### Student App
- **Home Dashboard** — wellness check-ins, influence points, quick actions
- **AI Companion** — supportive chat for exam stress, career guidance, and wellness
- **Pressure Shield** — AI-generated escape lines and reframes for peer-pressure situations
- **Anonymous Reporting** — submit pressure reports with AI-normalized categories (privacy by design — no student ID stored)
- **Clubs & Events** — browse and join campus clubs, RSVP to events
- **Mentor Connect** — request mentor assignments
- **Rewards** — redeem influence points for rewards
- **Campus Feed** — scroll through campus news, events, competitions, internships, and stories
- **Profile** — view influence points, club memberships, event RSVPs, and mentor assignments

### Admin App
- **Dashboard** — aggregate stats across students, clubs, events, mentors, and reports
- **AI Insights** — AI-generated trend analysis from wellness and report data
- **Manage Clubs, Events, Mentors, Rewards** — full CRUD for campus content
- **View Reports** — read anonymous pressure reports by hostel and category

### Cross-cutting
- **PWA** — installable, offline-capable shell with service worker
- **Network Guard** — online/offline detection with toast notifications
- **Cinematic Splash Screen** — 10-second animated logo intro
- **Responsive** — mobile-first design optimized for all viewport sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI | Groq (Llama 3.3 70B) via Supabase Edge Function |
| PWA | Service Worker, Web App Manifest |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project with the schema migrations applied
- A Groq API key (for the AI edge function)

### Installation

```bash
git clone https://github.com/your-username/nudgee-campus-influence.git
cd nudgee-campus-influence
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

The following secrets are configured on the Supabase Edge Function (not in `.env`):

| Secret | Description |
|--------|-------------|
| `GROQ_API_KEY` | Groq API key for AI features |
| `SUPABASE_URL` | Supabase project URL (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (auto-configured) |

### Database Setup

The migration files in `supabase/migrations/` define the full schema. Apply them through the Supabase dashboard or MCP tools in order:

1. `20260723165244_create_nudgee_schema.sql` — creates all tables, RLS policies, and indexes
2. `20260729125714_fix_security_issues.sql` — security hardening
3. `20260729130206_fix_is_admin_security_definer.sql` — is_admin() SECURITY INVOKER fix
4. `20260729140000_fix_is_admin_security_definer.sql` — admin_users mirror table + trigger

### Running Locally

```bash
npm run dev
```

The dev server starts automatically — no need to run it manually.

### Building for Production

```bash
npm run build
```

Output is in `dist/`, ready to deploy to any static host (GitHub Pages, Netlify, Vercel, etc.).

## Deployment

### GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
1. Installs dependencies
2. Runs typecheck and build
3. Deploys `dist/` to GitHub Pages

To enable: go to **Settings → Pages → Source → GitHub Actions**.

### Edge Function

The AI router edge function is in `supabase/functions/ai-router/`. Deploy it through the Supabase dashboard or MCP tools. Ensure `GROQ_API_KEY` is set as an edge function secret.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── admin/          # Admin app screens
│   │   ├── student/        # Student app screens
│   │   ├── AuthScreen.tsx  # Sign in / sign up
│   │   ├── Logo.tsx        # Logo, splash, loading components
│   │   ├── NetworkGuard.tsx
│   │   └── ui.tsx          # Shared UI primitives
│   ├── context/
│   │   └── AuthContext.tsx # Auth provider + hooks
│   ├── lib/
│   │   ├── ai.ts           # AI edge function client
│   │   └── supabase.ts    # Supabase client singleton
│   ├── types/
│   │   └── index.ts        # Shared TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── functions/
│   │   └── ai-router/      # Groq AI edge function
│   └── migrations/         # Database schema migrations
├── public/                 # PWA icons, manifest, service worker
└── .github/workflows/      # CI + deployment
```

## Security

- **Row Level Security** is enabled on every table
- **Ownership-scoped policies** — students can only read/write their own data
- **Admin-only policies** — content management restricted via `is_admin()` (SECURITY INVOKER)
- **Anonymous reporting** — pressure reports store no student ID (privacy by design)
- **Pinned search_path** — all database functions use `SET search_path = pg_catalog`

## License

This project is proprietary. All rights reserved.
