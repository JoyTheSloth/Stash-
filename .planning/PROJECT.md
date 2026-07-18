# ClipBrain

## What This Is

ClipBrain is an AI-powered clipboard memory that automatically monitors everything copied to the clipboard in the background, categorizes the content locally on the user's machine, and enables natural language semantic search for instant retrieval. It acts as an intelligence layer on top of raw clipboard history, turning snippets, keys, and links into structured, searchable memories.

## Core Value

Instantly find and retrieve any previously copied clipboard item using semantic natural language query search, eliminating the need to scroll through a chronological list or manually re-fetch data from external sources.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **CLIP-01**: Monitor clipboard changes in the background and save raw items locally.
- [ ] **CLIP-02**: Detect duplicates and prevent redundant history entries.
- [ ] **CLIP-03**: Detect copy source application (e.g. VS Code, Chrome) where platform APIs permit.
- [ ] **AI-01**: Automatically categorize clipboard content (API Keys, Passwords/Secrets, URLs, Code, Commands, JSON, SQL, Notes, etc.).
- [ ] **AI-02**: Generate concise, context-aware smart titles for copied items.
- [ ] **AI-03**: Create local embeddings for copied text and support semantic search.
- [ ] **STOR-01**: Local SQLite database storage for history, titles, and categories.
- [ ] **STOR-02**: Local vector search index (sqlite-vec or LanceDB) for fast local semantic retrieval.
- [ ] **SEC-01**: Detect secrets and encrypt sensitive data (API keys, passwords) locally using AES-256.
- [ ] **UI-01**: Build a premium React-based dashboard interface for searching, filtering, and viewing clipboard items.
- [ ] **UI-02**: Wrap application as a desktop system tray app (via Tauri) that runs in the background and displays/hides on global shortcut.
- [ ] **UI-03**: Allow users to favorite or pin items.

### Out of Scope

- **Cloud Synchronization** — Deferred to v2 to ensure maximum privacy and local-first architecture for launch.
- **OCR from images** — Deferred to future milestones to reduce initial MVP complexity.
- **Team clipboard sharing** — Out of scope for individual local developer utility.

## Context

ClipBrain is a local-first tool targeted at developers who copy dozens of high-value items (API keys, connection strings, Git commands, etc.) daily. Chronological clipboard managers quickly get overwhelmed, and manually maintaining text notes is tedious. ClipBrain solves this using local vector embeddings and SQLite.

## Constraints

- **Architecture**: Local-first. No cloud databases or logins. All user data must stay on the local machine.
- **Tech Stack**: Frontend must be React + Tailwind CSS. Desktop wrapper must be Tauri (preferred for performance and size) with Rust backend.
- **Database**: SQLite (using `sqlite-vec` or `LanceDB` for vector similarity search).
- **Security**: Hard requirement to automatically identify secrets/passwords and encrypt them.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Desktop App (Tauri) | Needed background clipboard monitoring and tray integration; websites cannot access system clipboard in background | — Pending |
| Local Vector DB (sqlite-vec / LanceDB) | Matches local-first private database requirement | — Pending |
| OpenAI Embeddings / Local Embeddings | We can start with OpenAI API but plan for local ONNX embeddings for fully offline search | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-17 after initialization*
