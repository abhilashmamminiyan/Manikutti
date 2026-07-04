# Manikutti

A modern web application built with [Next.js](https://nextjs.org/).

---

## 🚀 Features
* **Server-Side Rendering (SSR)** & **Static Site Generation (SSG)** via Next.js.
* **Responsive Design**: Optimized for all screen sizes.
* **Fast Performance**: Optimized images and code splitting.

## 🛠️ Getting Started

First, clone the repository:

```bash
git clone [https://github.com/abhilashmamminiyan/Manikutti.git](https://github.com/abhilashmamminiyan/Manikutti.git)
cd Manikutti
```
## Installation
Install the dependencies using your preferred package manager:
```bash
npm install
# or
yarn install
# or
pnpm install
```
## Development
Run the development server :
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Open `http://localhost:3000` with your browser to see the result.

## Build
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 🚀 CI/CD Pipeline & Deployments

This repository uses a decentralized **Polyrepo** architecture, meaning it manages its own builds and deployments independently from the Mobile App.

* **Quality Gates (PRs):** Any Pull Request opened against the `main` branch automatically triggers quality checks (Linting & Build Tests).
* **Automated Deployments:** A push/merge to `main` automatically deploys the Next.js application to its hosting provider (Vercel / Firebase Hosting).
* **Parent Sync:** Once a release is stable on `main`, an automated GitHub Action syncs the updated codebase back to the `manikutti-hub` parent repository, ensuring the parent always tracks the latest production-ready code.
