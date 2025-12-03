# Drafter - Database Setup Guide

This guide covers PostgreSQL database setup using Supabase for the Drafter application.

---

## Prerequisites

- [Supabase Account](https://supabase.com) (free tier available)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local development)

---

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Update these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Database Migration

Execute the schema in Supabase SQL Editor:

```bash
bun run db:migrate
```

Or manually:

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `scripts/01-schema.sql`
3. Run the query

---

## Database Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `bun run db:migrate` | Apply database migrations to Supabase       |
| `bun run db:reset`   | Reset database (drops and recreates tables) |
| `bun run db:seed`    | Seed database with sample data              |
| `bun run db:studio`  | Open Supabase Studio (local dev)            |
| `bun run db:types`   | Generate TypeScript types from schema       |

---

## Schema Overview

### Tables

| Table             | Purpose                              |
| ----------------- | ------------------------------------ |
| `user_profiles`   | User account data, subscription info |
| `onboarding_data` | User onboarding preferences          |
| `articles`        | Generated articles                   |
| `subscriptions`   | Stripe subscription tracking         |

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data.

---

## Local Development with Supabase CLI

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (alternative)
npm install -g supabase
```

### Initialize Local Supabase

```bash
# Start local Supabase
bun run db:start

# Stop local Supabase
bun run db:stop
```

### Generate TypeScript Types

```bash
bun run db:types
```

This generates types in `lib/database.types.ts`.

---

## Migration Files

Located in `scripts/`:

| File            | Description                                               |
| --------------- | --------------------------------------------------------- |
| `01-schema.sql` | Initial schema with all tables, indexes, and RLS policies |

### Creating New Migrations

1. Create a new file: `scripts/XX-description.sql`
2. Write your SQL migration
3. Run `bun run db:migrate`

---

## Troubleshooting

### "Could not find table" Error

Run the migration:

```bash
bun run db:migrate
```

### RLS Policy Errors

Ensure the user is authenticated and the policy allows the operation.

### Connection Issues

1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Ensure your IP is not blocked in Supabase settings

---

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
