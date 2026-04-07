# Rep'd Social Media Calendar

A full-stack social media planning and scheduling tool for **Rep'd** (repd.us), built for a one-person GovTech social media team.

**Stack:** React (Vite) · Node/Express · SQLite · Anthropic Claude API · Google Calendar API

---

## Features

- **Monthly Calendar** — color-coded post pills by type; click any day to add a post
- **AI Draft Generator** — describe a topic, pick a post type and date; Claude generates a LinkedIn-optimized draft with image suggestions and best posting times
- **6 Post Types** — Customer Launch, Case Study, New Product, Employee Shoutout, GovTech Thought Leadership, Conference Recap
- **Post Management** — Draft → Scheduled → Published status tracker; inline editing; team notes field
- **Google Calendar Sync** — OAuth2 integration; marks "Scheduled" posts as calendar events with color coding
- **Image Suggestions** — 3 Unsplash keyword chips per draft; paste your own image URL

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd socialcalendar

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
# Edit server/.env with your keys (see below)
```

### 3. Start the development servers

```bash
# Terminal 1 — API server (port 3001)
cd server && npm run dev

# Terminal 2 — React client (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** | Your Claude API key from [console.anthropic.com](https://console.anthropic.com) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID (for Calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Optional | `http://localhost:3001/auth/google/callback` |
| `PORT` | No | Server port (default: 3001) |
| `CLIENT_ORIGIN` | No | Frontend URL (default: `http://localhost:5173`) |
| `SESSION_SECRET` | No | Express session secret (change in production) |

---

## Google OAuth Setup (for Calendar Sync)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. **Enable** the **Google Calendar API** (APIs & Services → Library)
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Under **Authorized redirect URIs**, add: `http://localhost:3001/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** into `server/.env`
8. In the app sidebar, click **"Connect Google Calendar"** to authorize

> For production, add your production redirect URI and update `CLIENT_ORIGIN`.

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate` | Generate a LinkedIn draft via Claude AI |
| `GET` | `/posts` | List posts (filter by `?type=` or `?status=`) |
| `POST` | `/posts` | Create a new post |
| `PATCH` | `/posts/:id` | Update a post |
| `DELETE` | `/posts/:id` | Delete a post |
| `GET` | `/auth/google` | Start Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback |
| `GET` | `/auth/status` | Check Google auth status |
| `POST` | `/calendar/sync` | Sync a post to Google Calendar |

---

## Post Types & Colors

| Type | Color |
|------|-------|
| Customer Launch | Green `#22c55e` |
| Case Study | Blue `#3b82f6` |
| New Product | Purple `#a855f7` |
| Employee Shoutout | Amber `#f59e0b` |
| GovTech Thought Leadership | Orange `#f97316` |
| Conference Recap | Red `#ef4444` |

---

## Post Schema (SQLite)

```sql
posts (
  id              INTEGER PRIMARY KEY,
  type            TEXT,        -- one of the 6 post types
  date            TEXT,        -- YYYY-MM-DD
  copy            TEXT,        -- the LinkedIn post body
  status          TEXT,        -- draft | scheduled | published
  image_query     TEXT,        -- suggested image search keyword
  image_url       TEXT,        -- user-attached image URL
  notes           TEXT,        -- team collaboration notes
  best_time       TEXT,        -- AI-suggested posting time
  google_event_id TEXT,        -- Google Calendar event ID if synced
  created_at      TEXT
)
```
