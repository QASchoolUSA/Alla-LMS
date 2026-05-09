# Cursor Agent Prompt — Basic LMS (Next.js + Mux + Chatwoot + Supabase)

---

## Project Overview

Build a production-ready **Learning Management System (LMS)** using Next.js (App Router). The stack is:

- **Framework**: Next.js 14+ (App Router, TypeScript, Tailwind CSS v4)
- **Video**: Mux (upload, HLS delivery, signed JWT playback — no downloads)
- **Database & Auth & File Storage**: Supabase (PostgreSQL, Auth, Storage for PDFs/materials)
- **1-on-1 Messaging**: Chatwoot (self-hosted on VPS, embedded widget in Next.js)
- **Deployment**: Vercel (Next.js app) + Supabase cloud + Chatwoot on separate VPS

---

## Design Philosophy

The UI must feel **simple, clean, and professional** — like a refined SaaS product, not a generic template. Students should be able to open the app on their phone and immediately know what to do. Admins should be able to manage courses without confusion.

### Core Principles

- **One primary action per screen.** Never overwhelm the user with choices.
- **Mobile-first.** Design every screen at 375px first, then scale up. The lesson player and course list must be fully functional on mobile without horizontal scroll or layout breakage.
- **Neutral foundation + single accent.** Use a warm off-white surface (`#f7f6f2`) with a single teal primary accent (`#01696f`). No gradients, no color noise.
- **Touch targets ≥ 44px.** Every button, link, and interactive element must be large enough to tap comfortably on mobile.
- **Typography**: Use `Inter` (Google Fonts) for all body and UI text. Clean, readable, professional. No decorative fonts.
- **Spacing system**: All spacing in multiples of 4px using Tailwind's default scale. Generous whitespace — never cramped.
- **Transitions**: Subtle 150–180ms ease transitions on hover/focus states. Nothing jarring.
- **No icons in colored circles.** No gradient buttons. No busy backgrounds. Flat, clean surfaces with clear visual hierarchy.

### Design Tokens (Tailwind CSS v4 `@theme`)

Define these in your global CSS file:

```css
@import "tailwindcss";

@theme {
  --color-bg: #f7f6f2;
  --color-surface: #ffffff;
  --color-border: rgba(0,0,0,0.08);
  --color-text: #1a1916;
  --color-text-muted: #6b6a66;
  --color-text-faint: #b0afab;
  --color-primary: #01696f;
  --color-primary-hover: #0c4e54;
  --color-primary-active: #0f3638;
  --color-error: #c0392b;
  --color-success: #437a22;

  --font-body: 'Inter', sans-serif;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
```

---

## Folder Structure

```
lms/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (student)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── courses/
│   │       └── [courseId]/
│   │           ├── page.tsx                 ← Course overview
│   │           └── lessons/
│   │               └── [lessonId]/page.tsx  ← Video + PDF player
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx                     ← List/manage courses
│   │   │   ├── new/page.tsx
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx
│   │   │       └── lessons/
│   │   │           ├── new/page.tsx
│   │   │           └── [lessonId]/edit/page.tsx
│   │   └── students/page.tsx
│   ├── api/
│   │   ├── mux/
│   │   │   ├── upload/route.ts              ← Create Mux direct upload URL
│   │   │   ├── playback-token/route.ts      ← Generate signed JWT for playback
│   │   │   └── webhook/route.ts             ← Mux webhook (asset ready)
│   │   └── materials/
│   │       └── [materialId]/route.ts        ← Serve PDF via signed Supabase URL
│   └── layout.tsx
├── components/
│   ├── VideoPlayer.tsx
│   ├── PdfViewer.tsx
│   ├── ChatwootWidget.tsx
│   ├── LessonLayout.tsx
│   ├── LessonSidebar.tsx                    ← Collapsible lesson list (desktop sidebar / mobile drawer)
│   ├── UploadVideoForm.tsx
│   ├── MobileNav.tsx                        ← Bottom tab bar for student mobile
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       └── ProgressBar.tsx
├── lib/
│   ├── mux.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── auth.ts
├── middleware.ts
└── .env.local
```

---

## Environment Variables

```env
# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_KEY_ID=
MUX_SIGNING_PRIVATE_KEY=        # Base64-encoded RSA private key from Mux dashboard
MUX_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Chatwoot (self-hosted VPS URL)
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.yourdomain.com
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=
CHATWOOT_IDENTITY_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://yourlms.vercel.app
```

---

## Database Schema (Supabase PostgreSQL)

Run the following SQL in the Supabase SQL editor:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  published boolean default false,
  created_at timestamptz default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  mux_asset_id text,
  mux_playback_id text,
  mux_upload_id text,
  mux_status text default 'waiting' check (mux_status in ('waiting', 'preparing', 'ready', 'errored')),
  material_storage_path text,
  material_display_position text default 'after' check (material_display_position in ('before', 'after')),
  created_at timestamptz default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed boolean default false,
  last_position_seconds integer default 0,
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin reads all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Public reads published courses" on public.courses for select using (published = true);
create policy "Admin full access courses" on public.courses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Enrolled students read lessons" on public.lessons for select using (
  exists (
    select 1 from public.enrollments
    where user_id = auth.uid() and course_id = lessons.course_id
  )
);
create policy "Admin full access lessons" on public.lessons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Users read own enrollments" on public.enrollments for select using (auth.uid() = user_id);
create policy "Admin reads all enrollments" on public.enrollments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Users manage own progress" on public.lesson_progress for all using (auth.uid() = user_id);

-- Supabase Storage
insert into storage.buckets (id, name, public) values ('materials', 'materials', false);

create policy "Admin upload materials" on storage.objects for insert
  with check (bucket_id = 'materials' and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Enrolled users read materials via signed URL" on storage.objects for select
  using (bucket_id = 'materials');
```

---

## UI Components Library

Build a small set of reusable `components/ui/` components. Every component uses Tailwind classes only — no external UI library needed.

**`Button.tsx`**:
```tsx
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}
// primary: bg-[#01696f] text-white hover:bg-[#0c4e54]
// secondary: border border-black/10 bg-white text-[#1a1916] hover:bg-[#f3f0ec]
// ghost: text-[#6b6a66] hover:text-[#1a1916] hover:bg-black/5
// danger: bg-[#c0392b] text-white hover:bg-red-700
// All: min-h-[44px] px-4 rounded-lg text-sm font-medium transition-all duration-150
// loading state: show a spinner, disable pointer events
```

**`Card.tsx`**: `bg-white rounded-xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)]`

**`Input.tsx`**: `w-full h-11 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 focus:border-[#01696f] transition-all`

**`Badge.tsx`**: small pill for status — "Published" (green tint), "Draft" (gray), "Processing" (amber)

**`ProgressBar.tsx`**: thin teal bar showing lesson completion percentage within a course

---

## Feature Specifications

### 1. Auth Pages (`/login`, `/register`)

**Layout**: Centered card on a warm off-white background. No sidebar, no navigation — just the form.

**Visual spec:**
- White card, `max-w-sm`, `rounded-2xl`, `p-8`, subtle shadow
- App logo/name at the top (text-based, bold)
- Email + password `<Input>` fields, each with a visible `<label>` above
- Primary `<Button>` full-width: "Sign in" / "Create account"
- Link below to switch between login and register
- Inline error message in `text-[#c0392b] text-sm` below the button if auth fails
- No captcha, no social login (keep it simple)

**Mobile**: The card fills the screen on mobile (`w-full h-full rounded-none` on < sm breakpoint) so it feels native.

---

### 2. Student Layout & Navigation

**Desktop** (`md+`):
- Top navigation bar: logo left, "My Courses" link, user avatar/name right with dropdown ("Sign out")
- `h-14`, `bg-white`, `border-b border-black/[0.06]`, sticky at top
- Content area: `max-w-5xl mx-auto px-6 py-8`

**Mobile** (< `md`):
- Top bar: logo only (left) + user avatar (right)
- **Bottom tab bar** (`components/MobileNav.tsx`): fixed at bottom, 3 tabs: Home, My Courses, Chat
  - `h-16`, `bg-white`, `border-t border-black/[0.06]`
  - Each tab: icon + label, `min-w-[44px] min-h-[44px]`, teal highlight on active
  - Use Lucide icons: `Home`, `BookOpen`, `MessageCircle`
- Content area: `px-4 py-4 pb-24` (padding-bottom accounts for fixed bottom nav)

```tsx
// components/MobileNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageCircle } from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '#chat', label: 'Chat', icon: MessageCircle, onClick: () => window.$chatwoot?.toggle() },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black/[0.06] flex md:hidden z-50">
      {tabs.map(({ href, label, icon: Icon, onClick }) => {
        const active = pathname.startsWith(href.replace('#chat', '/'));
        return (
          <Link
            key={label}
            href={onClick ? '#' : href}
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
              ${ active ? 'text-[#01696f]' : 'text-[#6b6a66]' }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

### 3. Student Dashboard (`/dashboard`)

**Visual spec:**
- Greeting: `"Good morning, [Name] 👋"` in `text-xl font-semibold`
- Section: "Continue Learning" — horizontal scroll row of course cards on mobile, grid on desktop
- Each course card (`<Card>`):
  - Course thumbnail (16:9 aspect ratio, `rounded-lg`, `object-cover`)
  - Course title, bold
  - `<ProgressBar>` showing % of lessons completed
  - "Continue" button (ghost, small)
  - Full card is clickable → `/courses/[courseId]`
- Section: "Browse Courses" (published, not yet enrolled) — same card style without progress bar, "Enroll" button instead
- Empty state: if no courses enrolled yet — friendly message + "Browse Courses" CTA button

**Mobile**: Cards in a single column. "Continue Learning" row becomes a vertical stack.

---

### 4. Course Overview Page (`/courses/[courseId]`)

**Visual spec:**
- Course thumbnail full-width at top (16:9, max-height 320px on desktop)
- Below: course title (`text-2xl font-bold`), description (`text-[#6b6a66]`)
- "Enroll" button (primary, full-width on mobile) or "Enrolled" badge
- Lesson list below: numbered, each lesson row shows:
  - Position number, lesson title, duration (if available from Mux)
  - Checkmark icon if completed, lock icon if not enrolled
  - Tapping a row navigates to the lesson (if enrolled)
- Rows: `h-14 flex items-center px-4 border-b border-black/[0.04]`, alternating background subtle

---

### 5. Lesson Player Page (`/courses/[courseId]/lessons/[lessonId]`)

This is the most critical page. It must work perfectly on mobile.

**Desktop layout** (`lg+`):
```
┌────────────────────────┬─────────────────┐
│                        │  Lesson List    │
│   Video Player         │  (sidebar)      │
│   (16:9)               │  scrollable     │
│                        │                 │
├────────────────────────┤                 │
│   PDF Material         │                 │
│   (if any)             │                 │
└────────────────────────┴─────────────────┘
```
- Main content: `flex-1 min-w-0`
- Sidebar (`components/LessonSidebar.tsx`): `w-80 shrink-0 border-l border-black/[0.06]`
  - Lists all lessons in the course, highlights current one with teal left border
  - Checkmarks for completed lessons
  - Sticky within the viewport

**Mobile layout** (< `lg`):
- **Video player is full-width and sticks to top** as the user scrolls — `position: sticky; top: 0; z-index: 10`
  - The video is the primary focus; everything else scrolls beneath it
  - `aspect-ratio: 16/9; width: 100%`
- Below the video: lesson title, then PDF material (if any), then a "Next Lesson" button
- Lesson list sidebar becomes a **collapsible drawer** triggered by a "Lessons" button at the bottom of the page
  - The drawer slides up from the bottom (`translate-y` transition), shows the full lesson list
  - Tap any lesson to navigate; tap outside or swipe down to close

```tsx
// Sticky video on mobile
<div className="sticky top-0 z-10 bg-black w-full aspect-video lg:relative">
  <VideoPlayer playbackId={lesson.mux_playback_id} token={token} />
</div>
```

**Lesson sidebar component** (`components/LessonSidebar.tsx`):
```tsx
// Desktop: fixed sidebar panel
// Mobile: bottom sheet drawer with backdrop
// Props: lessons[], currentLessonId, progress[]
// Each lesson row: lesson number, title, completed checkmark
// Active lesson: teal left border + bold title
// Completed: muted text + green checkmark (Lucide: CheckCircle2)
// Locked (not enrolled): lock icon, pointer-events: none
```

**`components/LessonLayout.tsx`** — orchestrates content order:
```tsx
// If material_display_position === 'before': <PdfViewer /> then <VideoPlayer />
// If material_display_position === 'after': <VideoPlayer /> then <PdfViewer />
// If no material: just <VideoPlayer />
// Below content: prev/next lesson navigation buttons
```

**Prev/Next navigation**: always visible at the bottom of the lesson content
```tsx
<div className="flex justify-between mt-8 pt-4 border-t border-black/[0.06]">
  {prevLesson && <Button variant="secondary">← Previous</Button>}
  {nextLesson && <Button variant="primary" className="ml-auto">Next →</Button>}
</div>
```

---

### 6. Video Player (`components/VideoPlayer.tsx`)

```typescript
'use client';
import MuxPlayer from '@mux/mux-player-react';

interface Props {
  playbackId: string;
  token: string;
  onEnded?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

export default function VideoPlayer({ playbackId, token, onEnded, onTimeUpdate }: Props) {
  return (
    <MuxPlayer
      playback-id={playbackId}
      tokens={{ playback: token }}
      stream-type="on-demand"
      nodownload
      style={{ width: '100%', aspectRatio: '16/9', '--controls': 'auto' }}
      onEnded={onEnded}
      onTimeUpdate={(e: Event) => {
        const v = e.target as HTMLVideoElement;
        onTimeUpdate?.(Math.floor(v.currentTime));
      }}
    />
  );
}
```

- Mux player is already responsive by default
- `nodownload` removes the download button
- The signed token expires in 2h — never expose the raw playbackId without a token
- On `onTimeUpdate`, debounce saves to `lesson_progress.last_position_seconds` every 10 seconds
- On `onEnded`, call a server action to set `completed = true` in `lesson_progress`

---

### 7. Video Upload (Admin)

**Flow:**
1. Admin navigates to `/admin/courses/[courseId]/lessons/new` or edits an existing lesson
2. Frontend calls `POST /api/mux/upload` → server creates a Mux Direct Upload URL
3. Frontend uses `@mux/mux-uploader-react` with the returned `url` — shows a clear progress bar
4. On upload complete, store `mux_upload_id` in the `lessons` table
5. Mux webhook (`POST /api/mux/webhook`) receives `video.asset.ready` → update lesson with `mux_asset_id`, `mux_playback_id`, `mux_status = 'ready'`
6. The admin lesson page uses Supabase Realtime to listen for `mux_status` changes and shows a "Video processing..." state badge that updates to "Ready" automatically

**`app/api/mux/upload/route.ts`**:
```typescript
import Mux from '@mux/mux-node';
const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID!, tokenSecret: process.env.MUX_TOKEN_SECRET! });

export async function POST(req: Request) {
  // Verify admin session via Supabase before proceeding
  const upload = await mux.video.uploads.create({
    new_asset_settings: { playback_policy: ['signed'] },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL!,
  });
  return Response.json({ uploadId: upload.id, url: upload.url });
}
```

**Admin lesson form UI spec:**
- Clean form layout: label above each field, full-width inputs
- Video upload zone: dashed border box with upload icon + "Click or drag to upload video" text; replaces with upload progress bar once file is selected
- PDF upload: secondary file input below video section with "Upload PDF material" label + position toggle ("Show before video" / "Show after video" radio buttons, styled as a segmented control)
- Save button: primary, full-width at bottom, shows loading spinner during submission
- Status indicator: after saving, if video is processing, show amber "Processing..." badge next to the lesson title; auto-updates to green "Ready" via Supabase Realtime

---

### 8. PDF Material Display (`components/PdfViewer.tsx`)

**Upload (Admin):**
- Admin uploads a PDF when creating/editing a lesson
- Server action uploads to Supabase Storage `materials` bucket at `lessons/{lessonId}/{filename}`
- Stores path in `lessons.material_storage_path`

**Display (Student):**
- `GET /api/materials/[materialId]` verifies session + enrollment, returns a 1-hour Supabase signed URL
- Rendered via `react-pdf` as canvas — no browser PDF toolbar, no download button
- PDF container has `onContextMenu={(e) => e.preventDefault()}` to block right-click
- On mobile, PDF renders at full column width; multi-page PDFs are scrollable vertically
- Show page navigation: "< Page 2 of 8 >" simple controls below the PDF

```typescript
'use client';
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ signedUrl }: { signedUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-black/[0.06]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Document
        file={signedUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page
          pageNumber={pageNumber}
          width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 800) : 800}
        />
      </Document>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-black/[0.06]">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="text-sm font-medium text-[#01696f] disabled:opacity-30 min-h-[44px] px-3"
          >← Prev</button>
          <span className="text-sm text-[#6b6a66]">Page {pageNumber} of {numPages}</span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="text-sm font-medium text-[#01696f] disabled:opacity-30 min-h-[44px] px-3"
          >Next →</button>
        </div>
      )}
    </div>
  );
}
```

---

### 9. Protected Video Playback (Student)

**Flow:**
1. Student opens `/courses/[courseId]/lessons/[lessonId]`
2. Server component verifies enrollment via Supabase RLS
3. Server calls `/api/mux/playback-token?playbackId=xxx`, which:
   - Verifies Supabase session and enrollment
   - Returns `Mux.JWT.signPlaybackId(playbackId, { keyId, keySecret, expiration: '2h' })`
4. Client renders `<VideoPlayer playbackId={...} token={...} />`

---

### 10. 1-on-1 Messaging via Chatwoot

**Chatwoot runs on your VPS** (Docker). Each student gets their own isolated conversation thread with the admin.

**`components/ChatwootWidget.tsx`**:
```typescript
'use client';
import { useEffect } from 'react';

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  userHmac: string;
}

export default function ChatwootWidget({ userId, userEmail, userName, userHmac }: Props) {
  useEffect(() => {
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale: 'en',
      type: 'standard',
    };

    (function (d, t) {
      const BASE_URL = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL!;
      const g = d.createElement(t) as HTMLScriptElement;
      const s = d.getElementsByTagName(t)[0];
      g.src = BASE_URL + '/packs/js/sdk.js';
      g.async = true;
      g.onload = function () {
        window.chatwootSDK.run({
          websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN!,
          baseUrl: BASE_URL,
        });
        window.addEventListener('chatwoot:ready', function () {
          window.$chatwoot.setUser(userId, {
            email: userEmail,
            name: userName,
            identifier_hash: userHmac,
          });
        });
      };
      s.parentNode!.insertBefore(g, s);
    })(document, 'script');
  }, [userId]);

  return null;
}
```

**HMAC identity verification** (server-side):
```typescript
// lib/chatwoot.ts
import crypto from 'crypto';
export function generateChatwootHmac(userId: string): string {
  return crypto
    .createHmac('sha256', process.env.CHATWOOT_IDENTITY_TOKEN!)
    .update(userId)
    .digest('hex');
}
```

**Mobile note**: Chatwoot's widget is mobile-responsive by default. On mobile, it opens as a full-screen modal. The bottom tab bar "Chat" tab triggers `window.$chatwoot?.toggle()` to open it programmatically — so students always have one-tap access to chat.

---

### 11. Admin Layout & Dashboard

**Layout** (`(admin)/layout.tsx`):
- **Desktop**: left sidebar (`w-56`) + main content area. Sidebar: app logo at top, nav links (Dashboard, Courses, Students), user info at bottom.
  - `bg-white border-r border-black/[0.06] h-screen sticky top-0`
- **Mobile**: top header bar + hamburger → full-screen slide-in nav drawer from left
  - Admin panel is primarily desktop use, but must not break on mobile

**Admin Dashboard (`/admin/dashboard`):**
- 4 stat cards in a 2×2 grid (mobile) or 4-column row (desktop): Total Courses, Total Students, Total Lessons, Published Courses
  - Each: `<Card>` with a number in `text-3xl font-bold` and a label in `text-sm text-[#6b6a66]`
- Recent enrollments table below: student name, course, date

**Admin Courses (`/admin/courses`):**
- List of courses as rows: thumbnail, title, published badge, lesson count, "Edit" button
- "New Course" primary button top-right
- Empty state: centered illustration area + "Create your first course" CTA

**Admin Lesson Form:**
- Fields: Title (text input), Description (textarea, 3 rows), Position (number input)
- Video upload zone (see spec in Section 7)
- PDF upload + position toggle (see spec in Section 7)
- Auto-save draft behavior using `useActionState` or debounced server actions

**Admin Students (`/admin/students`):**
- Table: avatar initials, name, email, enrolled courses count, join date
- Each row has a "View Chat" button that deep-links to their Chatwoot conversation

---

## Key Packages to Install

```bash
npm install @mux/mux-node @mux/mux-player-react @mux/mux-uploader-react
npm install @supabase/supabase-js @supabase/ssr
npm install react-pdf
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install lucide-react
npm install jose
```

---

## Mobile Checklist

Before considering any page complete, verify all of these on a 375px viewport:

- [ ] No horizontal overflow or scroll
- [ ] All buttons and tap targets are at least 44×44px
- [ ] Video player sticks to top of screen while scrolling lesson content
- [ ] Lesson list accessible via bottom drawer (not hidden)
- [ ] Bottom tab bar present and all 3 tabs work
- [ ] PDF viewer renders at full column width, pages are readable without zooming
- [ ] Forms: inputs are at least `h-11` so iOS does not zoom in on focus (font-size ≥ 16px)
- [ ] Auth pages fill the screen on mobile (no tiny centered card)
- [ ] No `hover:`-only interactions — all interactive states also have `:active` equivalents
- [ ] Chatwoot chat bubble does not cover critical content; on mobile it opens full-screen
- [ ] `padding-bottom: 96px` (or `pb-24`) on all student page content so bottom nav doesn't overlap

---

## Security Checklist

- [ ] Mux playback IDs always use `signed` policy — never `public`
- [ ] Playback token endpoint checks Supabase session + enrollment before signing
- [ ] Mux webhook verified with `Mux.Webhooks.verifyHeader()` using `MUX_WEBHOOK_SECRET`
- [ ] PDF Storage bucket is **private** — all access via signed URLs through authenticated API route
- [ ] Chatwoot identity set with server-generated HMAC — prevents student impersonation
- [ ] Supabase RLS enabled on all tables — service role key only used server-side
- [ ] Admin routes protected in `middleware.ts` by checking `profiles.role`
- [ ] No direct Supabase Storage URLs ever sent to the client — always server-proxied
- [ ] Input font-size ≥ 16px to prevent iOS auto-zoom

---

## Deployment Notes

| Service | Where | Notes |
|---|---|---|
| Next.js app | Vercel | Add all env vars in Vercel dashboard |
| Supabase | Supabase cloud (free tier) | Run SQL schema before first deploy |
| Chatwoot | VPS (Docker) | Port 3000 behind nginx reverse proxy with SSL |
| Mux | Managed (mux.com) | Configure signing keys & webhook URL in Mux dashboard |

**Chatwoot VPS Docker quick-start:**
```bash
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot
cp .env.example .env
# Edit .env: set SECRET_KEY_BASE, POSTGRES_PASSWORD, REDIS_PASSWORD, FRONTEND_URL
docker compose up -d
```
Set `FRONTEND_URL=https://chat.yourdomain.com` and point your domain DNS to the VPS.

After Chatwoot is running:
1. Settings → Inboxes → Add Inbox → Website
2. Copy **Website Token** → `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`
3. Settings → Inboxes → Your Inbox → Configuration → Identity Validation → copy token → `CHATWOOT_IDENTITY_TOKEN`

---

## Build Order

1. Set up Supabase project, run SQL schema, configure Storage bucket
2. Set up Mux account, create signing keys, note webhook URL (set after Vercel deploy)
3. Scaffold Next.js app with TypeScript + Tailwind CSS v4 + Inter font from Google Fonts
4. Build `components/ui/` (Button, Card, Input, Badge, ProgressBar)
5. Build `middleware.ts` + auth pages (login/register) — mobile-fill layout
6. Build student layout with top nav (desktop) + bottom tab bar (mobile)
7. Build Mux upload API route + admin lesson form with `<MuxUploader>` + Supabase Realtime status
8. Build Mux webhook handler
9. Build playback token API route + `<VideoPlayer>` component
10. Build PDF upload (Supabase Storage) + `<PdfViewer>` + `/api/materials` route
11. Build lesson player page with sticky mobile video + collapsible lesson drawer
12. Build admin layout (sidebar desktop / drawer mobile) + all admin pages
13. Build student dashboard + course overview page
14. Integrate `<ChatwootWidget>` in student layout with HMAC identity + mobile tab trigger
15. Run through full mobile checklist on every page
16. Deploy to Vercel, update Mux webhook URL, configure Chatwoot on VPS
