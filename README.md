# Timeless

Timeless is a career-intelligence and AI-learning platform for university students and new graduates in mainland China who are pursuing product management and operations roles in the technology industry. Built on verifiable recruitment evidence, it provides a historical job archive, capability-by-company comparisons, cross-company role insights, weekly market reports, AI technology learning paths, and Ebbinghaus-based review reminders.

## Architecture

- React 19 and the Next.js App Router. The same source code supports both Next.js/Vercel and Vinext/OpenAI Sites.
- TypeScript, responsive CSS, and interactive Canvas particle formations.
- Drizzle ORM and Cloudflare D1. On Vercel, the application accesses the same SQLite data model through Cloudflare's official D1 REST API.
- Supabase Auth. The browser receives only the publishable key, while the server validates user JWTs.
- Volcengine Ark through its OpenAI-compatible Chat Completions API.
- Browser Notifications and a Service Worker for review reminders, with learning history and preferences stored locally.

## Run Locally

Node.js `>=22.13.0` is required.

```bash
npm ci
cp .env.example .env.local
npm run dev:vercel
```

Open `http://localhost:3000`. Before the first run, prepare the database and complete `.env.local` as described below.

## Required Configuration

1. **Supabase Auth:** Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Enable email authentication in Supabase Authentication and add both the local and production domains to the allowed redirect URLs.
2. **Volcengine Ark:** Set `ARK_API_KEY` and the actual endpoint/model ID in `ARK_MODEL_ID`. The default API base URL is `https://ark.cn-beijing.volces.com/api/v3`.
3. **Cloudflare D1:** Create a D1 database and an API token limited to `D1 Read` and `D1 Write` permissions for the relevant account. Then set the three `CLOUDFLARE_*` variables.
4. **Scheduled-endpoint secrets:** Generate unpredictable random values for `CORTEX_CRON_SECRET` and `CORTEX_BACKFILL_SECRET`.

Never commit secrets, Ark API keys, or D1 API tokens to Git. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; use only the Supabase publishable key there, never a service-role or secret key.

## Initialize Cloudflare D1

Load the three Cloudflare variables into the current terminal session, then run:

```bash
npm run db:setup:remote
```

The script applies every migration in `drizzle/` in order. Then run `npm run dev:vercel` and open `/api/jobs`. The endpoint should return JSON instead of a database-configuration error.

## Deploy to Vercel

1. Fork or clone this repository and import it into Vercel.
2. Add the variables from `.env.example`, except `TIMELESS_BACKEND_ORIGIN`, to the Production, Preview, and Development environments.
3. Use `npm run build:vercel` as the Build Command and `npm ci` as the Install Command. These settings are already included in `vercel.json`.
4. After deployment, add the final `https://*.vercel.app` domain to the Supabase Auth redirect URLs.

If you already operate a complete Timeless backend, you may set only `TIMELESS_BACKEND_ORIGIN=https://your-backend.example`. Vercel will transparently proxy `/api/*` to that backend, so remote D1 credentials are not required in the Vercel project.

## OpenAI Sites / Cloudflare Build

The Sites environment injects the `DB` binding through `.openai/hosting.json`:

```bash
npm run dev
npm run build
```

Vercel uses `npm run build:vercel`. Both build pipelines share `app/`, the API routes, and all business logic, so there is no duplicated frontend to maintain.

## Verification

```bash
npm run lint
npm run build
npm run build:vercel
npm test
```

Collectors should access only public company recruitment pages or public job APIs. Every record should retain its specific source URL, collection timestamp, and original evidence. When operating the system, comply with the target site's terms, robots directives, rate limits, and applicable personal-information protection requirements.
