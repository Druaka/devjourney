# 🧑‍💻 DevJourney

Welcome to DevJourney — a MEAN stack project designed to track my growth, explore new ideas and document my development progress. This space serves as both a learning tracker and a hands-on playground for experimenting with full-stack concepts.

Click the badge below to visit the GitHub page:

[![GitHub Page](https://img.shields.io/github/deployments/Druaka/devjourney/github-pages?label=GitHub%20Page)](https://druaka.github.io/devjourney/)

<picture><img src="https://img.shields.io/github/stars/Druaka/devjourney?style=social&label=Stars" alt="Stars"></picture>
<picture><img src="https://img.shields.io/github/contributors/Druaka/devjourney?label=Contributors" alt="Contributors"></picture>
<picture><img src="https://img.shields.io/github/license/Druaka/devjourney?label=License" alt="License"></picture>

---

## ✅ Project Status

<picture><img src="https://img.shields.io/github/actions/workflow/status/Druaka/devjourney/deploy-frontend.yml?branch=main&label=Build%20Status" alt="Build Status"></picture>
<picture><img src="https://img.shields.io/github/last-commit/Druaka/devjourney?label=Last%20Commit" alt="Last Commit"></picture>

This is an actively developing monorepo project with a live frontend, connected backend and clean CI/CD.

### What’s been accomplished so far:

- ✅ Clean monorepo structure with shared scripts and npm orchestration
- ✅ Node.js + Express backend deployed to Render with auto-deploys on Git push to `devjourney/backend`
- ✅ MongoDB hosted via OVH Discovery
- ✅ Angular frontend hosted on GitHub Pages with GitHub Actions deploy workflow
- ✅ Essential web analytics via Cloudflare

---

## 📂 Project Structure

```
devjourney/
├── .github/            # GitHub Actions (Pages deployment)
├── frontend/           # Angular app
├── backend/            # Node.js + Express API
├── docker-compose.yml  # Local dev environment (Mongo + Backend + Frontend)
├── package.json        # Root scripts to manage both apps
```

---

## 🔧 How to Run Locally

Start everything with Docker Compose (includes MongoDB, backend and frontend):

```bash
docker compose up --build
```

Frontend runs on http://localhost:4200/devjourney  
Backend runs on http://localhost:8080

The backend reads `MONGODB_URI` and `PORT` from environment variables set in `docker-compose.yml`.

### 🌍 Environment Switching

The frontend uses Angular's `fileReplacements` to swap environment files at build time:

| Command | Config | Environment file | API URL |
|---|---|---|---|
| `ng serve` | development | `environment.local.ts` | `http://localhost:8080/api` |
| `ng build` | production (default) | `environment.prod.ts` | `https://devjourney-backend.onrender.com/api` |

`ng build` uses the `production` configuration by default, which replaces `environment.local.ts` with `environment.prod.ts`. This means `npm run build:frontend` produces a production build targeting the hosted backend on Render.

---

## 🌐 Live Links

- Frontend: [https://druaka.github.io/devjourney/](https://druaka.github.io/devjourney/)
- Backend: [https://devjourney-backend.onrender.com/api/ping](https://devjourney-backend.onrender.com/api/ping)

---

## 🚧 Next Steps

Ideas and potential improvements are tracked as the project evolves. 

You can find the running list here: [![Open Issues](https://img.shields.io/github/issues/Druaka/devjourney?color=6f42c1&logo=github&style=flat)](https://github.com/Druaka/devjourney/issues)

---
