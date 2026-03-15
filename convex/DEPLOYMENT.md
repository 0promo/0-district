# 0 DISTRICT — Deployment Guide
## Convex.dev + Namecheap Domain Setup

---

## Step 1 — Install Convex CLI

```bash
npm install -g convex
```

---

## Step 2 — Initialise Convex in your project

```bash
cd /path/to/0Promo
npx convex dev
```

This will:
- Prompt you to log in to convex.dev (create a free account if needed)
- Create a new Convex project (name it: `0-district`)
- Generate `convex/_generated/` folder with type-safe API
- Set `CONVEX_DEPLOYMENT` in `.env.local`

---

## Step 3 — Deploy schema and functions

```bash
npx convex deploy
```

Your 18 tables and 15 function files will be live at:
`https://YOUR-PROJECT-ID.convex.cloud`

---

## Step 4 — Seed the Africa Map cities

```bash
npx convex run cities:seed
```

This populates the 8 Signal Map cities with lat/lng data.

---

## Step 5 — Set up Clerk Authentication

1. Create a free account at **clerk.com**
2. Create a new application: `0 District`
3. In Clerk Dashboard → **JWT Templates** → Add Convex template
4. Copy your Clerk **Publishable Key** and **Secret Key**

In Convex Dashboard → Settings → Environment Variables, add:
```
CLERK_WEBHOOK_SECRET = whsec_xxxxxxxxxxxx
```

Create a Clerk webhook pointing to your Convex HTTP action:
- Endpoint: `https://YOUR-PROJECT-ID.convex.site/clerk-webhook`
- Events: `user.created`, `user.updated`

---

## Step 6 — Connect Domain (Namecheap → Convex)

### 6a — Get your Convex custom domain ready

In **Convex Dashboard** → your project → **Settings** → **Custom Domains**:
1. Click **Add Custom Domain**
2. Enter: `0district.com` (or your domain)
3. Convex will give you a **CNAME record** to add

Example Convex CNAME target:
```
something.convex.cloud
```

### 6b — Configure Namecheap DNS

1. Log in to **namecheap.com**
2. Go to **Domain List** → click **Manage** on your domain
3. Click **Advanced DNS** tab
4. Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `[value from Convex dashboard]` | Automatic |
| URL Redirect | `@` | `https://www.0district.com` | — |

> If you want the apex domain (`0district.com`) to work directly,
> Namecheap supports **ALIAS/ANAME** records for apex domains.
> Add an ALIAS record for `@` pointing to the Convex CNAME target.

### 6c — Wait for DNS propagation

DNS changes take 5–30 minutes (usually under 10 minutes on Namecheap).

Check propagation:
```bash
dig www.0district.com CNAME
```

### 6d — Verify in Convex

Back in **Convex Dashboard** → Custom Domains → your domain should show ✅ **Verified**

Convex automatically provisions an **SSL certificate** (Let's Encrypt) once DNS is verified.

---

## Step 7 — Environment Variables

Create a `.env.local` file in your project root (never commit this):

```env
# Convex
CONVEX_DEPLOYMENT=your-project-id:production:xxxxxxxxxxxx
NEXT_PUBLIC_CONVEX_URL=https://YOUR-PROJECT-ID.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

---

## Step 8 — Integrate Convex in your frontend

### If upgrading to Next.js (recommended for v2):

Install:
```bash
npm install convex @clerk/nextjs
```

Wrap your app (`_app.tsx` or `layout.tsx`):
```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### Using Convex queries (real-time, auto-updates):
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Radio queue — live updates automatically
const queue = useQuery(api.radio.getQueue);

// Platform stats — homepage strip
const stats = useQuery(api.analytics.getPlatformStats);

// Post a track play
const recordPlay = useMutation(api.tracks.recordPlay);
await recordPlay({ trackId, completedPct: 85, durationSecs: 180, source: "radio" });
```

### If keeping vanilla HTML/JS (current site):

Install the Convex browser client:
```bash
npm install convex
```

```javascript
// js/convex.js
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://YOUR-PROJECT-ID.convex.cloud");

// Fetch platform stats
const stats = await client.query(api.analytics.getPlatformStats);
document.getElementById("statArtists").textContent = stats.artistCount.toLocaleString();

// Fetch radio queue
const queue = await client.query(api.radio.getQueue);
// ... render cards
```

For real-time subscriptions with vanilla JS:
```javascript
import { ConvexReactClient } from "convex/react";
// Use ConvexReactClient.onUpdate() for live subscriptions
```

---

## Convex Pricing

| Plan | Price | Includes |
|------|-------|----------|
| **Free** | $0/mo | 1M function calls/mo, 1GB storage, 1GB bandwidth |
| **Starter** | $25/mo | 10M calls, 10GB storage |
| **Pro** | $100/mo | 100M calls, 100GB storage, custom domains on free plan too |

> Custom domains are available on **all plans** including free.
> The free plan is sufficient for launch and early growth.

---

## Production Checklist

- [ ] `npx convex deploy` — functions deployed
- [ ] `npx convex run cities:seed` — Africa map cities populated
- [ ] Clerk webhook configured and verified
- [ ] DNS CNAME set in Namecheap
- [ ] Convex custom domain verified (SSL active)
- [ ] Environment variables set in Convex Dashboard
- [ ] Remove `console.log` statements from production functions
- [ ] Set up Convex **Dashboard alerts** for function errors

---

## Useful Commands

```bash
# Run local dev (hot reload)
npx convex dev

# Deploy to production
npx convex deploy

# Open Convex dashboard
npx convex dashboard

# Seed cities
npx convex run cities:seed

# View function logs
npx convex logs

# Check deployment status
npx convex status
```
