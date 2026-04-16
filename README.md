# Gemra Staking Prototype

This repository contains the staking prototype for the Gemra case-study flow.

## Routes

- `/staking` — main staking experience
- `/` — redirects to `/staking`

## Local development

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm dev
```

Open:

- [http://localhost:3000/staking](http://localhost:3000/staking)

## Production checks

Run typecheck:

```bash
pnpm exec tsc --noEmit --pretty false
```

Build for production:

```bash
pnpm build
```

Build the Cloudflare bundle:

```bash
pnpm exec opennextjs-cloudflare build
```

Start the production build locally:

```bash
pnpm start
```

## Cloudflare deployment

This project is preconfigured for Cloudflare Workers via OpenNext.

Use this deploy command in Cloudflare:

```bash
pnpm run deploy
```

Do not use:

```bash
npx wrangler deploy
```

That path triggers Cloudflare's auto-migration flow in CI and causes the workspace install failure.

## Notes

- The old bridge demo has been removed from this project.
- The root route now exists only to redirect users to `/staking`.
- Most critical runtime assets used by the staking flow are local to avoid delays or broken images in production deploys.
