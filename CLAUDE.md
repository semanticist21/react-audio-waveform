# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for audio waveform visualization. Outputs ESM + CJS bundles with TypeScript declarations.

## Commands

```bash
bun run build    # Build library to dist/ (ESM, CJS, .d.ts)
bun run dev      # Watch mode for development
```

**Note:** Requires Node.js 22.12+ (Vite 7 requirement). Use `nvm use default` if needed.

## Architecture

- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin) - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled

## Key Decisions

- React 19.2.0 with exact version pinning for type compatibility
- Library consumers must include this package in their Tailwind `content` config
- No CSS is bundled - consumers use their own Tailwind setup
- When write a commit msg, follow conventional commit with only title.