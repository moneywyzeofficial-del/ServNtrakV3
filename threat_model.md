# Threat Model

## Project Overview

ServNtrak is a mobile-first service management application for a small maintenance business. It uses a React/Vite frontend, an Express/TypeScript backend, PostgreSQL via Drizzle ORM, session-based authentication with Passport, WebAuthn passkeys, Google OAuth, Replit Object Storage for uploaded photos/documents, Anthropic for OCR and assistant features, Resend for password reset email, and Web Push for notifications.

Production scope for this scan is the main app served by `server/index.ts`, `server/routes.ts`, `server/replit_integrations/auth/*`, `server/replit_integrations/object_storage/*`, `server/storage.ts`, `shared/*`, and the corresponding production client in `client/src/*`. Dev-only areas such as `artifacts/mockup-sandbox/`, build scripts, and agent worktrees under `.claude/` should be ignored unless production reachability is demonstrated. Mockup sandbox is never deployed to production. Production traffic is assumed to be protected by platform-managed TLS.

## Assets

- **User accounts and sessions** — session cookies, password hashes, OAuth-linked identities, and WebAuthn credentials. Compromise enables full access to each tenant's business data.
- **Business records** — clients, appointments, service logs, reminders, purchases, payments, expense notes, quotes, employee data, profitability data, and location history. These records contain operationally sensitive and personal data.
- **Uploaded media and documents** — quick photos, suggested work photos, client/job photos, and scanned purchase documents. These can expose addresses, invoices, supplier details, and potentially financial or location data.
- **Secrets and third-party credentials** — `SESSION_SECRET`, database credentials, OAuth secrets, Anthropic/OpenAI keys, Resend key, VAPID keys, and object storage configuration. Leakage would enable impersonation or misuse of paid integrations.
- **Push subscription data** — device endpoints and keys tied to specific users. Abuse could enable unwanted messaging or user tracking.

## Trust Boundaries

- **Browser to API** — all client input is untrusted. Every API route must authenticate, authorize, and validate input server-side.
- **API to PostgreSQL** — backend code has broad database access. Query mistakes, missing tenant filters, or injection would expose all tenant data.
- **API to Object Storage** — uploaded files cross from user-controlled input into persistent storage. Read/write access must be scoped correctly and enforced server-side.
- **Authenticated user to another authenticated user** — this is a single-app, multi-tenant boundary implemented by per-record `userId` ownership checks. Cross-tenant data exposure is a primary risk.
- **API to logs/observability** — production logs are typically easier to access and retain longer than the primary datastore. Response bodies, AI output, and presigned URLs must be treated as sensitive data and should not be written verbatim to logs.
- **API to external services** — OCR/assistant requests, email delivery, OAuth, and push notifications send data to third parties or receive callbacks. Secrets and user data must not cross these boundaries unintentionally.
- **Production vs dev-only code** — `artifacts/mockup-sandbox/`, `.claude/` worktrees, and local scripts are not production surfaces and should not drive findings unless linked into production runtime.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/replit_integrations/auth/replitAuth.ts`, `server/replit_integrations/object_storage/routes.ts`, `server/storage.ts`, `shared/routes.ts`, `shared/schema.ts`, `client/src/App.tsx`.
- **Highest-risk areas:** session auth + WebAuthn, password reset origin handling, ownership enforcement for linked foreign keys (`clientId`, `serviceLogId`, `storeId`, `categoryId`) on both create and update paths, object storage uploads/downloads, AI-backed OCR/assistant endpoints, push notification endpoints, and global response logging in `server/index.ts`.
- **Public surfaces:** `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`, optional Google OAuth endpoints, `/api/uploads/request-url`, `/objects/*`.
- **Authenticated surfaces:** most `/api/*` business routes, `/api/assistant`, `/api/scan-document`, push endpoints, and WebAuthn credential management. Because self-service registration immediately creates a session and `isEmailVerified` is not enforced broadly, authenticated-only abuse paths can still be reachable from the public internet.
- **Admin surfaces:** none identified; there is no global admin role in current production code.
- **Usually ignore unless proven reachable:** `artifacts/mockup-sandbox/`, `.claude/`, build/config files, local scripts.

## Threat Categories

### Spoofing

The app relies on Passport sessions, optional Google OAuth, and WebAuthn passkeys. The system must only create authenticated sessions after successful credential verification, must keep session cookies unpredictable and protected in production, and must not leak authentication state in ways that help attackers enumerate valid accounts or credential types.

### Tampering

Users can create and modify many business records and upload files. The server must validate request bodies, must derive authorization from the session rather than client-supplied identifiers, and must ensure uploads cannot be written or later relabeled in ways that let one tenant tamper with another tenant's records or stored files. Any endpoint that accepts foreign keys to linked records must verify ownership at write time, not just when the record is later rendered.

### Information Disclosure

The application stores client addresses, photos, purchase documents, employee details, and financial records. API responses, object storage download routes, logs, and AI integration payloads must not expose one user's records to another user or to unauthenticated parties. Secrets, reset tokens, and sensitive file URLs must never appear in client code or logs. Routes that enrich user-owned rows with related objects are especially sensitive because an unvalidated foreign key can turn a normal list/detail response into a cross-tenant disclosure.

### Denial of Service

Public auth and upload-related routes, AI-backed OCR routes, and other potentially expensive operations can be abused for resource exhaustion. The application should ensure unauthenticated users cannot trigger unbounded storage, CPU, or paid third-party usage, and should keep request body sizes and retry behavior within safe limits. Open self-registration without verification or quotas materially widens the threat surface for authenticated-only paid integrations.

### Elevation of Privilege

There is no formal admin role, so the main privilege boundary is cross-tenant ownership. Every route and every object/file access path must enforce that a user can act only on their own records. Broken ownership checks, direct object references, or publicly reachable storage reads/writes would let an attacker gain access beyond their tenant boundary.
