# Changelog

## Unreleased

- Bump TypeScript to 6.x and require `ignoreDeprecations: "6.0"` in `tsconfig.json`.
  - Reason: `baseUrl` is deprecated and TypeScript 7 will remove it; this silences the editor warning while keeping existing path aliases.
  - Action required for contributors: run `npm install` to update dev dependencies to match the repository, and ensure your editor uses the workspace TypeScript version.

## 2026-04-27

- Refactor: use `DataTable` for Payments and Billing (client pages). Added search, filters, badges, and pagination. See PR #1.
