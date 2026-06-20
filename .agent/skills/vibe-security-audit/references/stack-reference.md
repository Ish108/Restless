# Stack-Specific Quick Reference

## Next.js + Supabase (most common vibe-coding stack)

* Use `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`) for server components and middleware
* Server Components: `createServerClient` from `@supabase/ssr` — never `createClient` with service role key
* Middleware: use `createServerClient` in `middleware.ts`, call `supabase.auth.getUser()` not `getSession()`
* `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are intentionally public — do not flag
* `SUPABASE_SERVICE_ROLE_KEY` must never have `NEXT_PUBLIC_` prefix — if it does, that's **CRITICAL**

## Firebase / Firestore

* Firestore Security Rules = equivalent of Supabase RLS — audit them with the same rigour
* Default test-mode rules expire after 30 days — check they haven't lapsed in production
* `firebase.initializeApp()` config object is public by design — security comes entirely from Rules
* Admin SDK (server-side only) bypasses Security Rules — equivalent to Supabase `service_role`

## Remix

* `loader` and `action` functions run server-side — still validate all inputs
* Use `getSession` from `@remix-run/node` sessions for auth state, not client cookies
* Remix doesn't have a `middleware.ts` equivalent — auth must be checked in each `loader`/`action`

## SvelteKit

* `+page.server.ts` load functions and form actions run server-side — validate inputs there
* `hooks.server.ts` `handle` function is the global middleware equivalent
* `$env/static/private` variables are safe (never bundled client-side); `$env/static/public` are exposed

## Nuxt

* `server/api/*` routes are server-side — validate inputs with zod in each handler
* `useRuntimeConfig()` — `runtimeConfig.public.*` is exposed client-side; `runtimeConfig.*` is server-only
* `defineEventHandler` + `readBody` pattern — always validate the body before using it

---

# Reference Implementations

## CSRF Protection for Next.js Pages Router

Use the `edge-csrf` package to protect all Pages Router API routes with a single middleware:

```bash
npm install edge-csrf
```

```typescript
// middleware.ts
import { createCsrfMiddleware } from '@edge-csrf/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const csrfMiddleware = createCsrfMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
});

export async function middleware(req: NextRequest) {
  // Run CSRF check first
  const csrfResponse = await csrfMiddleware(req);
  if (csrfResponse) return csrfResponse; // returns 403 on CSRF failure

  // Then run your existing auth middleware
  const res = NextResponse.next();
  // ... rest of middleware
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

```tsx
// In form components
import { getCsrfToken } from 'edge-csrf/nextjs';

export async function getServerSideProps(ctx) {
  const csrfToken = await getCsrfToken(ctx);
  return { props: { csrfToken } };
}

export default function MyForm({ csrfToken }) {
  return (
    <form method="POST" action="/api/update">
      <input type="hidden" name="_csrf" value={csrfToken} />
      {/* form fields */}
    </form>
  );
}
```

## SameSite Cookie Minimum

Set regardless of framework:

```typescript
res.setHeader('Set-Cookie', serialize('session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',    // prevents CSRF on top-level navigation
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}));
```

## IDOR Prevention — Ownership Check Utility

Create this helper and use it in every resource-by-ID route:

```typescript
// lib/assert-ownership.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type OwnershipCheckOptions = {
  table: string;        // e.g. 'invoices'
  idColumn?: string;    // defaults to 'id'
  ownerColumn?: string; // defaults to 'user_id'
}

/**
 * Verifies the authenticated user owns a specific resource.
 * Returns the resource if owned, throws 404 if not (404 doesn't leak existence).
 */
export async function assertOwnership(
  options: OwnershipCheckOptions,
  resourceId: string
) {
  const { table, idColumn = 'id', ownerColumn = 'user_id' } = options;

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(idColumn, resourceId)
    .eq(ownerColumn, user.id)
    .single();

  if (!data) {
    throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  return { user, resource: data };
}

// Usage in an API route:
// const { user, resource } = await assertOwnership({ table: 'invoices' }, params.id);
```
