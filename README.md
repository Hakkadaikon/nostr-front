# nostr-front

Nostr web client built with Next.js 14, TypeScript, Tailwind CSS, and Zustand.

## Getting Started

```bash
npm install
npm run dev
```

## Linting & Tests

```bash
npm run lint
npm run typecheck
npm run test
```

## Environment Variables

Create an `.env.local` file (Vercel picks this up automatically when added via the dashboard) based on `.env.example`:

```
NEXT_PUBLIC_DEFAULT_RELAYS=wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band
NEXT_PUBLIC_APP_NAME=Nostr Web Client
NEXT_PUBLIC_APP_DESCRIPTION=A modern web client for Nostr protocol
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_API_URL=
```

These variables are required both locally and in production (e.g. Vercel project settings).

## Deploying to Vercel

1. Push the latest changes to GitHub.
2. Create a new Vercel project and import the repository.
3. Set the environment variables from the section above in **Settings → Environment Variables** (copy the values from `.env.local`).
4. Leave the default build command (`npm run build`) and output directory (`.next`).
5. Vercel will install dependencies, run `next build`, and deploy automatically. Subsequent pushes to `main` trigger new deployments.

Build verification:

```bash
npm run build
```

This mirrors the command Vercel uses during deployment.
