# ServNtrakV2

Small overview and developer notes.

## Requirements
- Node.js (LTS)
- npm
- Workspace TypeScript: **6.x** (this repo requires TS 6 due to `baseUrl` deprecation handling)

> Note: After switching branches or cloning, run `npm install` so the workspace TypeScript matches the project.

## Quick setup

```bash
npm install
npm run check    # runs `tsc`
npm run build    # builds client and server
npm run dev      # run server in dev mode
```

## TypeScript note
We currently use `ignoreDeprecations: "6.0"` in `tsconfig.json` to silence the editor warning about `baseUrl` deprecation while keeping path aliases such as `@/*` and `@shared/*` working. When upgrading to TypeScript 7, revisit path alias strategy and remove `baseUrl` or migrate to supported configuration.

## What changed in this branch
- Refactor: `Payments` and `Billing` pages now use the shared `DataTable` UI component with search, filters, badges and pagination.
- Type fixes: some DataTable prop usages updated to the current API (`page`, `pageSize`, `totalCount`) and push subscription typing adjusted.

PR: https://github.com/tiago1982santos-design/ServNtrakV2/pull/1

## Contributing
- Follow branch naming: `refactor/...`, `fix/...`, `feat/...`
- Make sure to run `npm install` and use the workspace TypeScript in your editor (VSCode: select workspace TypeScript).
