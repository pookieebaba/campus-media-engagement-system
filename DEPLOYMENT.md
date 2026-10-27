# Deploying CMES to Render

This guide deploys the Campus Media Engagement System (CMES) to **Render** using the
existing `render.yaml` Blueprint at the repository root. The Blueprint defines two
services:

- **Backend** — `cmes-server` (Node web service, `server/`)
- **Frontend** — `cmes-client` (Static site, `client/`)

Render reads `render.yaml` and provisions both services automatically. You only set the
secret environment variables manually (the `sync: false` ones) and deploy in the right
order.

> Do **not** edit `render.yaml` — it is already correct.

---

## 1. Prerequisites

- The GitHub repository is pushed to GitHub and you have write access.
- A **MongoDB Atlas** cluster is running. You need the full connection string, e.g.
  `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/cmes?retryWrites=true&w=majority`.
  - Add a database user, create a database (e.g. `cmes`), and in **Network Access**
    allow Render to connect. The simplest option is `0.0.0.0/0` (allow from anywhere);
    a stricter option is Render's list of outbound IPs.
  - Keep this string secret — it is your `MONGO_URI` value.

---

## 2. Create a Render account

1. Go to <https://render.com>.
2. Click **Sign up** → **Sign up with GitHub** and authorize Render to access your
   GitHub account. (You can limit access to just this repository.)

---

## 3. Create the services from the Blueprint

1. In the Render dashboard, click **New +** → **Blueprint**.
2. Select the GitHub repository for CMES. (If it is not listed, configure Render's
   GitHub app access to include the repo.)
3. Render reads `render.yaml` and shows the two services it will create:
   `cmes-server` (web service) and `cmes-client` (static site).
4. Click **Apply** / **Create**. Render creates both services from the Blueprint.
   The `sync: false` environment variables start empty — they are set manually in the
   next step.

---

## 4. Environment variables to set manually

In the Render dashboard, open each service → **Environment** tab and add the
`sync: false` variables from `render.yaml`. (The others — `NODE_ENV`, `PORT`,
`JWT_EXPIRES_IN`, `SMTP_PORT` and the auto-generated `JWT_SECRET` — are filled by the
Blueprint.)

### Backend service: `cmes-server`

| Variable | Value | Required? |
| --- | --- | --- |
| `MONGO_URI` | Your MongoDB Atlas connection string | **Required** |
| `CLIENT_URL` | `https://cmes-client.onrender.com` (set this **after** the frontend deploys — see §5) | Required for login/CORS |
| `SMTP_HOST` | Your SMTP host (e.g. `smtp.gmail.com`) | Optional |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password / app password | Optional |

> `JWT_SECRET` is set to `generateValue: true` by the Blueprint, so Render
> auto-generates a secure value — do not set it yourself unless you want a known value.

### Frontend service: `cmes-client`

| Variable | Value | Required? |
| --- | --- | --- |
| `VITE_API_URL` | `https://cmes-server.onrender.com/api` (set this **before** the frontend builds — see §5) | **Required** |

---

## 5. Order of operations

Because the frontend is configured with the backend's URL at build time, and the
backend allows the frontend's origin via CORS, you must deploy in this order:

1. **Set `MONGO_URI` on `cmes-server`** (Atlas connection string) and save.
2. **Deploy the backend first.** Trigger a manual deploy (or let the Blueprint's first
   deploy run). Wait for it to go live. Confirm the health endpoint responds:
   ```
   https://cmes-server.onrender.com/api/health
   ```
   should return `{"status":"ok","env":"production"}`. Note this URL.

3. **Set `VITE_API_URL` on `cmes-client`** = `https://cmes-server.onrender.com/api`
   (the backend URL from step 2, with `/api` appended) and save.

4. **Deploy the frontend.** Trigger a manual deploy (or let the first build run). Wait
   for it to complete and go live. Note the frontend URL:
   `https://cmes-client.onrender.com`.

5. **Set `CLIENT_URL` on `cmes-server`** = `https://cmes-client.onrender.com` (the
   frontend URL from step 4). This allow-lists the frontend origin so login works —
   authentication uses httpOnly cookies with credentials, so the exact origin
   (protocol + host, no trailing slash) must match. Save and let the backend redeploy.

After this, login on the frontend talks to the backend via `VITE_API_URL`, and the
backend's CORS allows the frontend origin via `CLIENT_URL`. Both URLs end in
`*.onrender.com` as the Blueprint names them.

---

## 6. After deploy — seed the database (Render Shell)

The deployed database is empty. Seed the base reference data (roles, blocks, users,
events) using the existing seed script. Render Shell runs commands inside the running
backend container, where `MONGO_URI` is already set.

1. In the Render dashboard, open the **`cmes-server`** service.
2. Click the **Shell** tab (top of the service page) → **Open Shell**.
3. Run the base seed script:
   ```
   npm run seed
   ```
   This runs `node scripts/seed.js` against your Atlas database (via `MONGO_URI`).

4. Log in to the frontend using the seeded head/faculty/student credentials the script
   prints or defines. Confirm the dashboard loads data.

> If `npm run seed` exits with a connection error, confirm `MONGO_URI` is set on the
> service and that Atlas Network Access allows Render's IP range (`0.0.0.0/0` is the
> simplest during testing).

---

## 7. Re-seeding demo evaluation events

For live evaluation (e.g. demonstrating QR attendance), seed the demo events that span
the evaluation dates:

1. Open the **`cmes-server` Shell** as in §6.
2. Run:
   ```
   npm run seed:demo
   ```
   This runs `node scripts/seed-demo-events.js`, which creates full-day demo events on
   the configured evaluation dates (26–30 October) so you can show QR check-in working.

3. Log in as head/faculty, open the events, and publish/start check-in to scan the QR
   codes during your evaluation.

---

## Notes

- **Local dev is unaffected.** `node server.js` / `npm run dev` still listen on port
  `5000` (or `process.env.PORT` when set); `dotenv` loads `.env` locally and is
  skipped gracefully when no `.env` exists on Render.
- **Secrets stay local.** `server/.env` is gitignored and never committed; on Render
  all secrets come from the dashboard environment variables.
- **Rebuilds.** On the frontend, changing `VITE_API_URL` requires a new build — Render
  rebuilds on the next deploy or manual rebuild.
- **Health check.** `GET /api/health` requires no auth and is a quick way to confirm the
  backend is up.
