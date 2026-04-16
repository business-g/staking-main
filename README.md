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

Start the production build locally:

```bash
pnpm start
```

## Notes

- The old bridge demo has been removed from this project.
- The root route now exists only to redirect users to `/staking`.
- Most critical runtime assets used by the staking flow are local to avoid delays or broken images in production deploys.
