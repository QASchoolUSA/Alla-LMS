# Alla LMS

A production-ready Learning Management System built on **Next.js 15 (App Router)**, **Supabase**, **Mux**, and **Chatwoot**. Mobile-first, signed video playback, private PDF materials, and 1-on-1 student ↔ admin chat out of the box.

```
┌─────────────────────────────────────────────┐
│  Next.js (Vercel)                           │
│  ├ App Router + Server Actions              │
│  ├ Supabase Auth + RLS                      │
│  ├ Mux signed playback (JWT, RS256)         │
│  ├ Supabase Storage (private PDFs)          │
│  └ Chatwoot widget (HMAC identity)          │
└─────────────────────────────────────────────┘
            │            │             │
       ┌────▼───┐   ┌────▼────┐  ┌─────▼─────┐
       │Supabase│   │   Mux   │  │  Chatwoot │
       │ cloud  │   │ managed │  │ self-host │
       └────────┘   └─────────┘  └───────────┘
```

## Stack

| Concern         | Tool                                   |
| --------------- | -------------------------------------- |
| Framework       | Next.js 15 + TypeScript + App Router   |
| Styling         | Tailwind CSS v4 (`@theme` tokens)      |
| Auth + DB       | Supabase (Postgres, Auth, RLS)         |
| File storage    | Supabase Storage (private bucket)      |
| Video           | Mux (Direct Upload, signed JWT)        |
| Messaging       | Chatwoot (self-hosted, embedded)       |
| Icons           | lucide-react                           |
| JWT             | jose                                   |
| Deployment      | Vercel + Supabase + your Chatwoot VPS  |

---

## 1. Local setup

```bash
# install deps
npm install

# copy env template
cp .env.example .env.local
# … fill in the values (see the next section) …

npm run dev
```

The app boots at `http://localhost:3000`. Until Supabase is configured the auth-protected routes will redirect to `/login` and show an env error — fill in the variables and reload.

## 2. Provision Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In **SQL editor**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates:
   - tables: `profiles`, `courses`, `lessons`, `enrollments`, `lesson_progress`
   - a trigger that auto-creates a `profiles` row when an auth user signs up
   - RLS policies for student / admin access
   - the private `materials` Storage bucket
3. Copy the values from **Project settings → API** into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`  *(server-only — never expose)*
4. Sign up your first user via `/register`, then promote yourself to admin in the SQL editor:

   ```sql
   update public.profiles
      set role = 'admin'
    where id = (select id from auth.users where email = 'you@example.com');
   ```

## 3. Provision Mux

1. Create a Mux account, then in **Settings → Access Tokens** create a new token with **Mux Video — Full access**. Copy:
   - `MUX_TOKEN_ID`
   - `MUX_TOKEN_SECRET`
2. **Settings → Signing Keys → Generate new key**. Mux will reveal:
   - `MUX_SIGNING_KEY_ID`
   - `MUX_SIGNING_PRIVATE_KEY` — paste the full base64 blob as-is.
3. **Settings → Webhooks → Create new webhook**:
   - URL: `https://yourdomain.com/api/mux/webhook`
   - Copy the signing secret into `MUX_WEBHOOK_SECRET`
4. Mux's webhook handler updates each lesson's `mux_status` → `ready` automatically when processing finishes. The admin lesson page picks this up via Supabase Realtime.

## 4. Provision Chatwoot (optional, but recommended)

The simplest path is Docker on a small VPS:

```bash
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot
cp .env.example .env
# edit .env: SECRET_KEY_BASE, POSTGRES_PASSWORD, REDIS_PASSWORD, FRONTEND_URL
docker compose up -d
```

Point `chat.yourdomain.com` at the VPS, terminate TLS via nginx, then in the Chatwoot UI:

1. **Settings → Inboxes → Add Inbox → Website**.
2. Copy the **Website Token** → `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`.
3. Open the inbox → **Configuration → Identity Validation** → copy the HMAC token → `CHATWOOT_IDENTITY_TOKEN`.
4. Set `NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.yourdomain.com`.

If you skip Chatwoot the LMS still works — the chat tab simply won't render.

## 5. Environment variables

See [`.env.example`](./.env.example). Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; the rest are server-only.

## 6. Deploy

| Service     | Where             | Notes                                                     |
| ----------- | ----------------- | --------------------------------------------------------- |
| Next.js     | Vercel            | Add every env var in **Project → Settings → Env vars**.   |
| Supabase    | Supabase cloud    | Run [`supabase/schema.sql`](./supabase/schema.sql) once.   |
| Chatwoot    | Your VPS (Docker) | Behind nginx + TLS; see step 4.                            |
| Mux         | mux.com           | Webhook URL must match your Vercel domain.                 |

---

## Folder layout

```
app/
├ (auth)/                        login & register pages
├ (student)/                     student layout, dashboard, courses, lesson player
├ (admin)/admin/                 admin layout, dashboard, courses CRUD, students
└ api/
   ├ mux/upload/                 create direct-upload URL (admin only)
   ├ mux/playback-token/         RS256-signed JWT for a private playback id
   ├ mux/webhook/                Mux → updates lesson.mux_status
   ├ materials/[lessonId]/       short-lived signed Supabase URL for the PDF
   └ lesson-progress/            saves last position / completed flag
components/
├ ui/                            Button, Card, Input, Badge, ProgressBar…
├ VideoPlayer.tsx                Mux player with throttled progress reporting
├ PdfViewer.tsx                  react-pdf, no download / no right-click
├ LessonLayout.tsx               video + PDF + prev/next navigation
├ LessonSidebar.tsx              desktop sidebar / mobile bottom-sheet
├ MobileNav.tsx                  bottom tab bar (Home / Courses / Chat)
├ ChatwootWidget.tsx             SDK loader with HMAC identity
└ UploadVideoForm.tsx            <MuxUploader> + progress + status badge
lib/
├ supabase/{client,server,proxy}.ts
├ mux.ts                         JWT signing + webhook verification
├ chatwoot.ts                    HMAC helper
├ auth.ts                        getSessionUser / requireUser
├ env.ts                         centralized env var access
└ types.ts                       shared DB types
proxy.ts                         refreshes Supabase session + admin gate (Next.js 16 proxy)
supabase/schema.sql              full SQL schema + RLS + storage bucket
```

---

## Security model

- **Mux** playback IDs are always **signed** (`playback_policy: ['signed']`). Tokens are minted server-side after verifying enrollment. They expire in 2 hours. The Mux player is rendered with `nodownload`.
- **PDFs** live in a private Storage bucket. The `app/api/materials/[lessonId]` route signs a 1-hour URL **only** after re-checking enrollment. The viewer disables right-click and the browser PDF toolbar.
- **Webhooks** verify the `mux-signature` header with a constant-time HMAC compare before accepting any payload.
- **Chatwoot identity** is set with a server-side HMAC of the user id, preventing impersonation from a malicious browser.
- **RLS** is enabled on every table. Students can only read lessons they're enrolled in; only admins (via `profiles.role = 'admin'`) get full access.
- The **service-role** key is used only inside two server-only routes: the Mux webhook handler and the admin PDF upload action.

## Mobile checklist (375px viewport)

- [x] No horizontal scroll
- [x] Tap targets ≥ 44×44px (Button, MobileNav, sidebar rows)
- [x] Lesson video sticks to the top while scrolling
- [x] Lesson list reachable via bottom-sheet drawer + floating "Lessons" button
- [x] Bottom tab bar (Home · Courses · Chat) on every student screen
- [x] Form inputs use `font-size: 16px` to prevent iOS auto-zoom
- [x] Auth pages fill the screen on `<sm`
- [x] Chatwoot opens full-screen on mobile

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # production server
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```
