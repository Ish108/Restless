# Security Audit Checklist — 10 Sections, 44 Items

## Section 1 — Environment Variables & Secret Management

### 1.1 — Hardcoded secrets
Search every source file, config file, and any committed `.env` files for secrets embedded directly in code. Grep patterns to check:
`sk_live_`, `sk_test_`, `sk-`, `pk_live_`, `Bearer `, `eyJ` (JWT prefix), `ghp_`, `gho_`, `github_pat_`, `xoxb-`, `xoxp-` (Slack), `AKIA` (AWS), any 32+ character alphanumeric string in quotes.

### 1.2 — .gitignore coverage
Verify `.env`, `.env.local`, `.env.production`, `.env*.local` are all in `.gitignore`. Check if any `.env` file was previously committed to git history (even if since removed — secrets in git history are still exposed and must be rotated).

### 1.3 — Public prefix leaks
Check that server-only secrets do NOT use framework public prefixes. In Next.js, `NEXT_PUBLIC_` is bundled into client JS and visible to anyone. In Vite, `VITE_`. In Create React App, `REACT_APP_`. Keys that must NEVER be public-prefixed:
* Database service role / admin keys
* Stripe secret keys (`sk_`)
* OpenAI / Anthropic API keys
* SMTP credentials
* Any key granting write or admin access

> **Note:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally public by Supabase design — do not flag these. Flag `SUPABASE_SERVICE_ROLE_KEY` if public-prefixed.

### 1.4 — Console/log leaks
Search for `console.log`, `console.error`, and error boundaries that may print environment variables or raw error objects containing secrets to the browser console or client-visible error messages.

### 1.5 — Source map exposure
Check if production source maps are enabled (`productionBrowserSourceMaps` in `next.config.js`, `sourcemap` in `vite.config`). Source maps allow anyone to reconstruct original source code including any inlined values.

### 1.6 — Startup validation
Verify the app fails fast with a clear error if required environment variables are missing at startup, rather than silently running with undefined values (which causes cryptic runtime errors or insecure fallbacks).

---

## Section 2 — Database Security

> Primarily for Supabase. For Firebase, check Firestore Security Rules. For server-only databases (Prisma), adapt and note architecture.

### 2.1 — RLS enabled on all tables
Verify Row Level Security is enabled on EVERY table in the `public` schema. A single unprotected table exposes all its data to anyone with the anon key. Run this in the Supabase SQL editor to find unprotected tables:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

### 2.2 — RLS policies exist (not just enabled)
A table with RLS enabled but NO policies silently returns empty results for all queries — this looks like a bug, not a security issue, and is a common AI mistake. Verify every RLS-enabled table has at least SELECT and INSERT policies. Detect with:
```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity = true AND p.tablename IS NULL;
```

### 2.3 — WITH CHECK clauses on INSERT/UPDATE policies
Verify all INSERT and UPDATE policies include `WITH CHECK` clauses. Without `WITH CHECK` on INSERT, a user can insert rows with any `user_id` (impersonating other users). Without it on UPDATE, a user can change a row's `user_id` to steal ownership. The correct pattern:
```sql
CREATE POLICY "Users manage own data" ON your_table
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.4 — Policy identity source (auth.uid() not auth.jwt())
Ensure RLS policies use `auth.uid()` for identity, NOT `auth.jwt()->'user_metadata'`. User metadata can be modified by authenticated end users, making it an unreliable and spoofable identity source.

### 2.5 — Service role key isolation
The `service_role` key bypasses ALL RLS. Verify it is NEVER used in client-side code, never imported in components, and only used server-side where RLS bypass is genuinely necessary (admin operations, trusted webhooks). If found in a file that could be bundled client-side, this is **CRITICAL**.

### 2.6 — Storage bucket policies
If using Supabase Storage, verify storage buckets have RLS policies defined. Buckets can default to publicly accessible. Check `SELECT * FROM storage.policies;` and verify per-user access controls exist for any bucket storing user data.

### 2.7 — SQL injection
Check for raw SQL queries using string concatenation or template literals. The Supabase client library is safe by default, but raw `.rpc()` calls, `postgres.js` queries, or `pg` queries may be vulnerable:
```javascript
// ❌ Vulnerable
db.query(`SELECT * FROM users WHERE id = ${req.body.id}`)

// ✅ Safe
db.query('SELECT * FROM users WHERE id = $1', [req.body.id])
```

### 2.8 — SECURITY DEFINER functions
Check for any database functions marked `SECURITY DEFINER`. These run with the privileges of the function creator (often superuser), not the calling user, and can bypass RLS entirely. Verify these don't expose data beyond what the user should access.

---

## Section 3 — Authentication & Session Management

### 3.1 — Auth middleware exists
Verify authentication middleware exists and runs on protected routes. In Next.js, this is `middleware.ts` in the project root. Check the matcher config ensures it covers all necessary paths — not just `/dashboard` but also `/settings`, `/profile`, `/api/user/*`, dynamic routes like `/dashboard/[id]`.

### 3.2 — Default-deny routing
Is the middleware an **allowlist** (public routes are explicitly listed, everything else requires auth) or a **blocklist** (protected routes are explicitly listed, everything else is public)? Allowlist/default-deny is significantly safer — new routes are automatically protected. Flag blocklist patterns.

### 3.3 — getUser() vs getSession() (Supabase-specific)
For Supabase apps, verify security-sensitive server-side operations use `supabase.auth.getUser()` which validates the JWT against Supabase servers, NOT `supabase.auth.getSession()` which only reads the local JWT without server-side verification. Using `getSession()` for auth decisions is a security vulnerability.

### 3.4 — Auth callback handler
Verify the `/auth/callback` route (or equivalent OAuth callback) properly exchanges auth codes for sessions, handles errors gracefully, and doesn't expose tokens in URLs, logs, or client-side state.

### 3.5 — Session token storage
Verify session tokens are stored in `httpOnly` cookies, NOT in `localStorage` or `sessionStorage`. Values in `localStorage` are accessible to any JavaScript on the page — including XSS payloads. The Supabase SSR helpers handle this correctly; check that raw `supabase-js` client isn't storing tokens insecurely.

### 3.6 — Every protected API route checks auth
Check that EVERY API route handling user data verifies authentication before processing the request. AI tools frequently add new API routes and forget the auth check. Look for routes that skip `getUser()` / `getSession()` entirely, especially ones added in later development iterations.

### 3.7 — OAuth security (if applicable)
If OAuth is implemented, verify callback URLs are validated against an allowlist, state parameters are used for CSRF protection, and tokens are not logged or exposed in URLs or error messages.

### 3.8 — Password reset flows (if applicable)
Verify reset tokens expire (max 1 hour), are single-use, and are transmitted securely. Check that expired or already-used tokens are rejected, not silently accepted.

---

## Section 4 — Server-Side Validation

### 4.1 — Schema validation on every API route
Verify all API routes and server actions validate input using a schema validation library (Zod, Valibot, ArkType, Yup) on the server side. Frontend validation is UX only — it can be bypassed instantly with `curl`. Every input must be re-validated server-side.
```typescript
// ✅ Correct pattern
const Schema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
});
const result = Schema.safeParse(await req.json());
if (!result.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
```

### 4.2 — Identity from session, never from request body
Verify user identity for write operations is ALWAYS taken from the authenticated session or JWT token — never from request body fields like `{ userId: "..." }` or `{ role: "admin" }`. An attacker can send any value in a request body.

### 4.3 — XSS / input sanitisation
Check that user-generated content rendered in HTML is properly sanitised. Look for `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, or unescaped template literals that render user content without sanitisation. If found, verify DOMPurify or equivalent is applied before render.

### 4.4 — HTTP method enforcement
Verify state-changing operations (create, update, delete) use POST/PUT/PATCH/DELETE, not GET. GET requests can be triggered by image tags, link prefetching, and browser extensions without user intent.

### 4.5 — Error responses don't leak internals
Verify error responses don't expose stack traces, SQL error messages (which reveal table/column names), file paths, or environment variable names. The client should receive generic messages; internal details go to server-side logs only.

### 4.6 — Webhook signature verification
If the app receives webhooks (Stripe, GitHub, Clerk, etc.), verify it validates the webhook signature before processing. Without verification, anyone can send fake webhook events to trigger billing updates, user changes, or data mutations.

---

## Section 5 — Dependency & Package Security

### 5.1 — npm audit results
Run `npm audit` (or `pnpm audit` / `yarn audit` / `bun audit`) and report vulnerabilities grouped by severity. Any CRITICAL or HIGH vulnerabilities in production dependencies must be resolved before launch.

### 5.2 — Hallucinated package detection
Check for any installed packages with suspiciously low download counts, very recent publish dates, or names that don't match well-known packages. AI tools sometimes hallucinate package names; attackers publish malware under those exact names (dependency confusion attack). Flag any package you don't recognise — tell the user to verify on npmjs.com before trusting it.

### 5.3 — Lockfile committed
Verify a lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`) is committed to the repository. Without a lockfile, `npm install` can silently pull different (potentially compromised) versions on each deploy.

### 5.4 — Outdated packages with known CVEs
Check for outdated packages, especially auth libraries, crypto libraries, and framework versions. Pay attention to any package more than 2 major versions behind — these often have known, published CVEs.

### 5.5 — Unused dependencies
AI tools install packages they don't end up using. Each unused package is unnecessary attack surface. Flag packages in `package.json` with no imports anywhere in the codebase.

---

## Section 6 — Rate Limiting

### 6.1 — Expensive operations rate-limited
Identify all API routes that call external paid APIs (OpenAI, Anthropic, Stripe, Resend, Twilio, etc.) and verify they have rate limiting. Without it, an attacker can spam the endpoint and run up enormous bills. This is one of the most common ways vibe-coded apps get financially wrecked.

### 6.2 — Auth endpoints rate-limited
Verify login, signup, password reset, and OTP endpoints have rate limiting to prevent brute force attacks and credential stuffing.

### 6.3 — Rate limiting implementation quality
If rate limiting exists, verify it:
* Is applied server-side (not just frontend debouncing, which is trivially bypassed)
* Uses a persistent backing store (Redis, Upstash) not in-memory storage that resets on every deploy
* Limits by IP or authenticated user ID, not just by route

---

## Section 7 — CORS Configuration

### 7.1 — API route CORS policy
If the app exposes API routes intended only for its own frontend, verify CORS headers restrict access to the app's own domain(s). Flag any sensitive endpoint with `Access-Control-Allow-Origin: *`.

### 7.2 — Credentials + wildcard conflict
If CORS is configured with `Access-Control-Allow-Credentials: true`, verify it is NEVER paired with `Access-Control-Allow-Origin: *`. This combination is invalid (browsers reject it) and indicates a misconfiguration.

---

## Section 8 — File Upload Security

> Only applies if the app accepts file uploads. Mark ⬚ N/A if no upload functionality exists.

### 8.1 — Server-side file validation
Verify file type and size are validated on the server, not just the frontend. Check MIME type against an allowlist, not just file extension (attackers rename `malware.exe` to `photo.jpg`). For maximum security, verify magic bytes (file signature) not just the declared MIME type.

### 8.2 — Storage permissions per upload type
Verify uploaded files are stored with appropriate access controls. Public uploads (profile photos) and private uploads (documents, invoices) must have different bucket policies. Never store private documents in a public bucket.

### 8.3 — Filenames sanitised
Verify the original filename from the user is never used directly for storage. Use `crypto.randomUUID()` or a hash for the stored filename. Original filenames can contain path traversal sequences (`../../etc/passwd`) or null bytes.

---

## Section 9 — CSRF Protection

> Cross-Site Request Forgery lets an attacker trick a logged-in user's browser into making an authenticated request to your app without the user's knowledge — changing their email, deleting their account, making a purchase.

### 9.1 — Framework-level CSRF coverage
Determine whether the framework provides automatic CSRF protection and whether it covers all state-mutating routes:
* **Next.js App Router server actions** — CSRF protection is built in via origin checking. Mark ✅ if the app uses only server actions for mutations.
* **Next.js Pages Router API routes** (`/api/*`) — NO automatic CSRF protection. Every state-mutating POST/PUT/PATCH/DELETE route needs explicit protection.
* **Remix actions** — built-in CSRF protection via same-origin cookie session. Mark ✅.
* **SvelteKit form actions** — built-in CSRF protection in SvelteKit 1.x+. Mark ✅. Verify the version is 1.0+.
* **Custom Express/Hono/Fastify servers** — no automatic protection. Every route needs explicit CSRF middleware.

### 9.2 — State-mutating GET routes
Re-check Section 4.4 findings here: any GET route that changes data is CSRF-vulnerable by design, because browsers and prefetchers fire GET requests freely. Flag all GET routes that write to the database, send emails, trigger payments, or modify user state.

### 9.3 — CSRF token implementation (if needed)
For any framework or route that lacks automatic CSRF protection, verify a CSRF token pattern is implemented. See `references/stack-reference.md` for implementation examples.

### 9.4 — SameSite cookie attribute
Verify session cookies use `SameSite=Lax` or `SameSite=Strict`. `SameSite=None` without a strong CSRF token is dangerous. `SameSite=Lax` is the minimum acceptable default and prevents most CSRF attacks on its own for top-level navigations.

---

## Section 10 — Insecure Direct Object Reference (IDOR)

> IDOR is the most common logic-level vulnerability in vibe-coded apps. The app correctly checks that a user is logged in, but fails to check that the specific resource they're requesting actually belongs to them. An attacker who is authenticated as User A can access User B's data simply by changing an ID in the URL or request body.

### 10.1 — URL parameter ownership checks
For every route that accepts a resource ID as a URL parameter (e.g. `/api/invoices/[id]`, `/api/messages/[id]`, `/dashboard/project/[projectId]`), verify the server checks that the authenticated user owns or has permission to access that specific resource — not just that they're logged in.

```typescript
// ❌ IDOR vulnerable — only checks auth, not ownership
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // BUG: fetches ANY invoice by ID — attacker changes the ID to steal data
  const { data } = await supabase.from('invoices').select('*').eq('id', params.id).single();
  return Response.json(data);
}

// ✅ Correct — checks both auth AND ownership in the same query
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)   // ← ownership check
    .single();
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(data);
}
```

### 10.2 — Request body ID injection
Check all POST/PUT/PATCH routes that accept an ID in the request body. An attacker can send `{ "userId": "<victim-id>", ... }` to impersonate another user. Identity must always come from the session, never from the request body.

```typescript
// ❌ IDOR vulnerable — trusts user_id from body
const { userId, content } = await req.json();
await supabase.from('posts').insert({ user_id: userId, content });

// ✅ Correct — takes user_id from verified session only
const { data: { user } } = await supabase.auth.getUser();
const { content } = await req.json();
await supabase.from('posts').insert({ user_id: user.id, content });
```

### 10.3 — Horizontal privilege escalation across resource types
Check every entity type that has an owner (posts, comments, orders, documents, profiles, subscriptions, team memberships). For each one, verify both read and write operations enforce ownership. AI tools frequently protect the "obvious" resources (user profiles) but miss secondary ones (comments, uploaded files, notification preferences, API keys, connected accounts).

Create a mental map during Pass 1: list every database table that has a `user_id` or `owner_id` column. Then verify every API route touching those tables has an ownership check. Any table without a check is an IDOR.

### 10.4 — Admin/elevated role endpoints
Verify routes intended only for admins don't just check `isLoggedIn` — they check the user's role from the server-side session or database, never from a request body or query parameter field like `?admin=true`.

```typescript
// ❌ Broken admin check — role from request is attacker-controlled
const { role } = await req.json();
if (role !== 'admin') return forbidden();

// ✅ Correct — role from verified session/database
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
```

### 10.5 — Supabase RLS as IDOR defence (double-check)
If RLS is correctly configured (Section 2 passes), Supabase-level IDOR is largely handled at the database layer. However, verify that:
* Routes using the `service_role` client (which bypasses RLS) still perform manual ownership checks
* Any `.rpc()` calls to stored procedures enforce ownership inside the function
* Joined queries don't accidentally expose related records from other users through the join
