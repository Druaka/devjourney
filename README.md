# 🧑‍💻 DevJourney

Welcome to DevJourney — a MEAN stack project designed to track my growth, explore new ideas and document my development progress. This space serves as both a learning tracker and a hands-on playground for experimenting with full-stack concepts..

Click the badge below to visit the GitHub page:

[![GitHub Page](https://img.shields.io/github/deployments/Druaka/devjourney/github-pages?label=GitHub%20Page)](https://druaka.github.io/devjourney/)

<picture><img src="https://img.shields.io/github/stars/Druaka/devjourney?style=social&label=Stars" alt="Stars"></picture>
<picture><img src="https://img.shields.io/github/contributors/Druaka/devjourney?label=Contributors" alt="Contributors"></picture>
<picture><img src="https://img.shields.io/github/license/Druaka/devjourney?label=License" alt="License"></picture>

---

## ✅ Tech Stack

<picture><img src="https://img.shields.io/github/actions/workflow/status/Druaka/devjourney/deploy-frontend.yml?branch=main&label=Build%20Status" alt="Build Status"></picture>
<picture><img src="https://img.shields.io/github/last-commit/Druaka/devjourney?label=Last%20Commit" alt="Last Commit"></picture>

This monorepo contains a live Angular frontend, a Node/Express backend, and a MongoDB database. Below is a concise summary of the core technologies, hosting, and operational notes.

| Layer | Technology |
|---|---|
| Frontend | [Angular](https://angular.dev/) · [PrimeNG](https://primeng.org/) — SPA built with Angular CLI; deployed to GitHub Pages |
| Backend | [Node.js](https://nodejs.org/) · [Express](https://expressjs.com/) — REST API that fetches and sanitizes data from TCGdex; auto-deploys on Render |
| Database | [MongoDB](https://www.mongodb.com/) (OVHcloud MongoDB Discovery) · [Mongoose](https://mongoosejs.com/) — managed cluster; connection via `MONGODB_URI` |
| Data source | [TCGdex](https://tcgdex.dev/) — official Pokémon TCG API used to fetch sets and card metadata |
| Hosting & infra | Frontend: [GitHub Pages](https://pages.github.com/) · Backend: [Render](https://render.com/) (free-tier) · DB: [OVHcloud MongoDB Discovery](https://www.ovhcloud.com/) · Local dev: [Docker Compose](https://docs.docker.com/compose/) |
| DevOps | [Docker Compose](https://docs.docker.com/compose/) (local) · [GitHub Actions](https://docs.github.com/actions) (CI/CD) · [angular-cli-ghpages](https://github.com/angular-schule/angular-cli-ghpages) for frontend deploys |

**Notes**
- **Backend lifecycle:** on startup the server connects to MongoDB, fetches and sanitizes the latest TCG sets via the TCGdex SDK, stores them in MongoDB and caches the results in memory for fast reads.
- **Render free-tier:** the backend may spin down after ~15 minutes of inactivity; the first request after spin-down triggers a cold start which can take up to ~1 minute.
- **Database:** production and staging data are hosted on OVHcloud's MongoDB Discovery offering. Connection details are supplied via `MONGODB_URI`.
- **Local development:** run `docker compose up --build` to bring up MongoDB, backend and frontend. Frontend: `http://localhost:4200/devjourney`. Backend: `http://localhost:8080`.
- **Environment:** the backend reads `MONGODB_URI` and `PORT` from environment variables (see `docker-compose.yml`).

**Recommended runtimes (tested)**
- Node.js 18+ (LTS)
- Angular CLI (project configured via `angular.json`)
- MongoDB 4.4+ (managed by OVH)

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
