# Contributing Guide

Thanks for your interest in the Go Learning App! We welcome bug reports, feature requests, documentation fixes, and code contributions. This document outlines the easiest way to get started.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Development Workflow](#development-workflow)
3. [Coding Guidelines](#coding-guidelines)
4. [Submitting Changes](#submitting-changes)
5. [Reporting Issues](#reporting-issues)
6. [Community Expectations](#community-expectations)

## Project Setup

1. **Install prerequisites**
   - Node.js **20.19.0** or newer
   - npm **10.x** (bundled with Node 20)
2. **Fork and clone the repository**
   ```bash
   git clone https://github.com/<your-username>/go-learning-app.git
   cd go-learning-app
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start the dev server**
   ```bash
   npm run dev
   ```
   The app is available at <http://localhost:5173>. Vite reloads automatically when you save files.

## Development Workflow

- Create a feature branch from `main`:
  ```bash
  git checkout -b feat/<short-description>
  ```
- Keep your fork up to date:
  ```bash
  git remote add upstream https://github.com/<upstream-owner>/go-learning-app.git
  git fetch upstream
  git rebase upstream/main
  ```
- Make small, focused commits. Prefer conventional-style messages if possible (`feat:`, `fix:`, `docs:` ...).

## Coding Guidelines

- TypeScript is required for new logic. Extend types in `src/types` when needed.
- Manipulate global state via Pinia actions defined in `src/stores/game.ts`.
- Keep UI responsive. When adding components, check the layout at 19×19, 13×13, and 9×9 board sizes.
- If you introduce third-party dependencies, justify the addition in your pull request.
- Before submitting a PR, run:
  ```bash
  npm run build
  npm run preview   # optional manual smoke test
  ```

## Submitting Changes

1. Ensure your branch is rebased onto the latest `main`.
2. Push your branch and open a pull request on GitHub.
3. Fill out the PR template (if available) and include:
   - A summary of the change.
   - Screenshots or GIFs for UI updates.
   - Testing steps you followed.
4. Be responsive to review feedback; discussions are part of the collaboration.

## Reporting Issues

- Search existing issues first to avoid duplicates.
- When filing a bug, include:
  - Steps to reproduce
  - Expected vs. actual behaviour
  - Browser/OS information
  - Screenshots or console logs when relevant
- Feature requests should explain the problem being solved and, if possible, offer a suggested approach.

## Community Expectations

By contributing you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Be respectful, stay constructive, and help keep this community friendly for Go learners of all backgrounds.

Thank you for helping improve the Go Learning App! 🙇‍♀️🙇‍♂️
