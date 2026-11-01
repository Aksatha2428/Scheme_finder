# 🚀 Scheme Finder — Complete Deployment Guide (Render & Vercel)

This document provides step-by-step instructions to deploy **Scheme Finder** to **Render** and **Vercel**.

---

## 📋 Architecture Overview

Scheme Finder is a full-stack web application:
- **Frontend**: React 18 + Vite (SPA in `/src`, compiles to `/dist`)
- **Backend**: Node.js + Express (`server/index.js`), using Node’s native `node:sqlite` database (`data/schemefinder.db`) and AES-256 encrypted file storage (`data/encrypted_docs/`).
- **Prerequisite Runtime**: **Node.js 22.5.0+** (Required because `node:sqlite` is built into Node 22+).

---

## 🎯 Choose Your Deployment Strategy

| Strategy | Best For | Complexity | Cost |
| :--- | :--- | :--- | :--- |
| **Option 1: Render All-in-One (Recommended)** | Frontend & Backend in a single service | ⭐ Easiest | Free tier available |
| **Option 2: Vercel (Frontend) + Render (Backend)** | Ultra-fast Global Edge CDN for UI + Node API | ⭐⭐ Moderate | Free tier on both |
| **Option 3: Vercel Standalone (Frontend-only)** | Quick UI showcase (uses built-in client engine) | ⭐ Easiest | Free |

---

## 🟢 Option 1: Deploy All-in-One on Render (Recommended)

In this setup, a single **Render Web Service** builds the React frontend, starts the Express server, and serves both `/api/*` and the compiled UI on one unified domain. There are **zero CORS configuration hurdles**.

### Step 1: Push Your Code to GitHub
1. Initialize or commit all your latest changes:
   ```bash
   git add .
   git commit -m "Configure deployment files for Render and Vercel"
   git push origin main
   ```

### Step 2: Create a New Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation and select **Web Service**.
3. Connect your GitHub account and choose your repository: `Aksatha2428/Scheme_finder`.
4. Fill in the deployment settings:

| Field | Value |
| :--- | :--- |
| **Name** | `scheme-finder` (or your choice) |
| **Region** | Singapore / Frankfurt / Oregon (choose closest to your users) |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server/index.js` |
| **Instance Type** | `Free` |

### Step 3: Configure Environment Variables on Render
Scroll down to the **Environment Variables** section and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `22.12.0` | **CRITICAL:** Enables built-in `node:sqlite` support |
| `NODE_ENV` | `production` | Enables production optimizations |
| `NVIDIA_API_KEY` | `your_api_key_here` | *(Optional)* For AI chatbot integration |

> [!IMPORTANT]
> **Do not forget `NODE_VERSION=22.12.0`!**
> The backend relies on Node's native `node:sqlite` module, which requires Node 22 or higher. Without this environment variable, Render defaults to an older Node version and the build will fail with `Cannot find module 'node:sqlite'`.

### Step 4: Deploy & Verify
1. Click **Create Web Service**.
2. Render will run:
   - `npm install`
   - `npm run build` (builds the Vite React app into `/dist`)
   - `node server/index.js` (starts Express and mounts static files from `/dist`)
3. When the logs display `[Scheme Finder Backend] Secure API running on http://localhost:...`, click your live Render URL (e.g. `https://scheme-finder.onrender.com`).
4. Test:
   - ✅ Homepage loads
   - ✅ Search & Filter schemes
   - ✅ AI Chatbot replies
   - ✅ OCR Document scanner upload & eligibility checks

*(Optional: You can also use the included [render.yaml](file:///c:/Users/akshu/OneDrive/Desktop/newsf/render.yaml) file by clicking **New + > Blueprint** in Render).*

---

## ⚡ Option 2: Deploy Frontend on Vercel + Backend on Render (Split Architecture)

If you prefer Vercel’s global Edge CDN for the Vite frontend while keeping the Express + SQLite backend on Render:

### Part A: Deploy the Backend on Render
1. Follow **Option 1**, but when setting up the service name, call it `scheme-finder-api`.
2. Set the **Build Command** to: `npm install`
3. Set the **Start Command** to: `node server/index.js`
4. Add the Environment Variable:
   - `NODE_VERSION` = `22.12.0`
   - `CLIENT_URL` = `https://your-app.vercel.app` (or `*`)
5. Copy your Render backend URL (e.g. `https://scheme-finder-api.onrender.com`).

### Part B: Connect Vercel to your Backend
In the project root, open [vercel.json](file:///c:/Users/akshu/OneDrive/Desktop/newsf/vercel.json) and configure the API proxy rewrite:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-BACKEND-NAME.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*(Replace `YOUR-BACKEND-NAME.onrender.com` with your actual Render URL).*

### Part C: Deploy Frontend to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New... > Project** and select your GitHub repository.
3. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `NVIDIA_API_KEY`: *(Optional)* Your NVIDIA API key if calling client-side.
5. Click **Deploy**.
6. Vercel will build and assign you a domain like `https://scheme-finder.vercel.app`.

> [!TIP]
> **Why this rewrite works seamlessly:**
> With Vercel's rewrite rule in `vercel.json`, your React code continues making clean requests to `/api/chat/message`, `/api/documents`, etc. Vercel automatically forwards these calls to Render under the hood, completely avoiding CORS blocks!

---

## 🌐 Option 3: Deploy Frontend Only on Vercel (Static / Fallback Mode)

Scheme Finder is built with offline resilience: if the backend server is not available, the frontend automatically falls back to its built-in client-side rule evaluation engine.

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Leave defaults as detected by Vercel:
   - **Framework**: `Vite`
   - **Output Directory**: `dist`
4. Ensure the included [vercel.json](file:///c:/Users/akshu/OneDrive/Desktop/newsf/vercel.json) is present in the repository root (it routes all subpaths to `/index.html` so client-side routing never produces 404s).
5. Click **Deploy**.

---

## 🔑 Environment Variables Reference

| Variable | Required For | Recommended Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_VERSION` | **Render Backend** | `22.12.0` | **Mandatory** for `node:sqlite` database compatibility. |
| `NODE_ENV` | **Render / Production** | `production` | Enables Express production mode & cache optimizations. |
| `PORT` | **Render Backend** | *(Leave blank)* | Render automatically injects and assigns this port. |
| `NVIDIA_API_KEY` | **Optional AI Chat** | `nvapi-...` | Key for NVIDIA NIM LLM endpoint. |
| `CLIENT_URL` | **Backend (Split setup)** | `https://*.vercel.app` | Allowed CORS origin for frontend requests. |

---

## 🛠️ Common Gotchas & Troubleshooting

### 1. Error: `Cannot find module 'node:sqlite'`
- **Cause:** Render used default Node 18 or 20 instead of Node 22+.
- **Solution:** Add `NODE_VERSION` = `22.12.0` in the Render Environment Variables tab, then trigger a manual re-deploy with cache cleared.

### 2. Render Free Tier Spin-Down / Delay
- **Symptom:** First request takes ~30-50 seconds to respond after inactivity.
- **Explanation:** Render puts free web services to sleep after 15 minutes of inactivity.
- **Solution:** Set up a free 5-minute health check ping using [UptimeRobot](https://uptimerobot.com) targeting `https://<your-service>.onrender.com/api/schemes`.

### 3. Vercel 404 on Page Refresh
- **Cause:** Single Page Applications (SPA) need the web server to rewrite all route requests back to `/index.html`.
- **Solution:** Handled automatically by the included `vercel.json` rewrite configuration.

### 4. Database Reset on Free Render Re-deployments
- **Explanation:** Render free tier instances use ephemeral disk storage, so `schemefinder.db` re-seeds on new deployments.
- **Solution:** For persistent storage across builds, attach a **Persistent Disk** on Render (under the Disks tab in Render service settings mounted at `/data`), or transition SQLite to an external database like Turso / Supabase if enterprise persistence is needed.

---

## 📦 Included Configuration Files
- [render.yaml](file:///c:/Users/akshu/OneDrive/Desktop/newsf/render.yaml) — Render Blueprint configuration
- [vercel.json](file:///c:/Users/akshu/OneDrive/Desktop/newsf/vercel.json) — Vercel SPA routing & rewrites
- [package.json](file:///c:/Users/akshu/OneDrive/Desktop/newsf/package.json) — Specifies `"engines": { "node": ">=22.5.0" }`
- [.gitignore](file:///c:/Users/akshu/OneDrive/Desktop/newsf/.gitignore) — Protects `.env`, `dist/`, and local databases
