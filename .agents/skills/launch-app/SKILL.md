---
name: launch-app
description: Launch the Shopify + Gadget app for runtime validation.
---

# Launch App

This repo is a Shopify embedded app backed by Gadget. Use the development app
config unless the task explicitly requires production behavior.

## Prerequisites

- Run from the repo root.
- Install dependencies first: `yarn install --frozen-lockfile`.
- You need Shopify CLI auth and access to the Gadget development app.
- Prefer a globally installed `shopify` CLI when available. If `shopify` is not
  on `PATH`, use `npx @shopify/cli@latest` for the CLI commands below.

## Start the app

Preferred path when `shopify` is installed:

1. Select the development config:
   - `shopify app config use shopify.app.development.toml`
2. Start the app:
   - `yarn shopify:dev`

Fallback path when `shopify` is not installed globally:

1. Select the development config:
   - `npx @shopify/cli@latest app config use shopify.app.development.toml`
2. Push the development app config:
   - `npx @shopify/cli@latest app deploy --config shopify.app.development.toml --force`
3. Start the app:
   - `npx @shopify/cli@latest app dev --config shopify.app.development.toml --no-update`

## Verify startup

- Wait for the CLI to print the preview/admin URL and show the app as running.
- Open the surfaced URL in a browser.
- Confirm the embedded app loads instead of a blank page or auth failure.
- For product workflow changes, navigate to `/product-types` and confirm the
  table renders and row editors can open.

## If blocked

- Missing Shopify auth, missing Gadget access, or CLI startup failures are real
  runtime blockers. Record the exact command and error.
- Stop the dev server with `Ctrl+C` when validation is complete.
