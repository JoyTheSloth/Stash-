# Roadmap: ClipBrain

## Overview

ClipBrain will be built starting from a solid Tauri + React framework foundation. We will first build a background clipboard listener and database storage, then add AI classification and encryption, proceed to semantic search using local vector embeddings, and finally polish the UI dashboard with global keyboard hotkeys to create a seamless developer experience.

## Phases

- [x] **Phase 1: Foundation & Desktop Clipboard Engine** - Set up Tauri + React + SQLite boilerplate, write Rust clipboard background listener, and handle basic persistence.
- [ ] **Phase 2: AI Classification & Secret Security** - Implement local content classification, metadata/title generation, and local AES-256 encryption for passwords and keys.
- [ ] **Phase 3: Local Semantic Search Engine** - Build vector embedding generation and integrate local vector search (via sqlite-vec or LanceDB).
- [ ] **Phase 4: Dashboard UI & Global Shortcut** - Create the React user interface, category filters, quick copy, and global hotkey to toggle window visibility.

## Phase Details

### Phase 1: Foundation & Desktop Clipboard Engine
**Goal**: Establish a running Tauri desktop app that sits in the system tray, monitors clipboard changes, and writes raw entries to a local SQLite database.
**Depends on**: Nothing
**Requirements**: [CLIP-01, STOR-01, SEC-01, UI-02]
**Success Criteria**:
  1. Tauri app compiles, runs, and minimizes to the system tray.
  2. Copying any text system-wide trigger a Rust listener to write the copy text to the SQLite database.
  3. The app database correctly persists copies across app restarts.
**Plans**: 2 plans

Plans:
- [x] 01-01: Scaffold Tauri, React, Tailwind, and SQLite boilerplate.
- [x] 01-02: Implement system tray configuration, background clipboard loop, and database writing.

### Phase 2: AI Classification & Secret Security
**Goal**: Classify clipboard items automatically and secure sensitive passwords/keys with local encryption.
**Depends on**: Phase 1
**Requirements**: [CLIP-02, CLIP-03, AI-01, AI-02]
**Success Criteria**:
  1. Copied strings are auto-categorized into categories (code, commands, passwords, URLs, etc.).
  2. Concise, context-aware smart titles are generated for clipboard memories.
  3. API keys and passwords are encrypted using AES-256 before writing to SQLite.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Setup classification engine (AI API integration or lightweight model) and title generator.
- [ ] 02-02: Implement duplicate filtering and AES-256 encryption utility for designated secret categories.

### Phase 3: Local Semantic Search Engine
**Goal**: Enable semantic, natural language search over clipboard history using local embeddings.
**Depends on**: Phase 2
**Requirements**: [AI-03, STOR-02]
**Success Criteria**:
  1. New clipboard text generates semantic embeddings upon copying.
  2. Embeddings are stored in the local vector index (sqlite-vec or LanceDB).
  3. Semantic search queries return items relevant to the meaning of the query rather than exact keyword matches.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Setup vector database storage/index and local or API embedding generator.
- [ ] 03-02: Write semantic retrieval queries and integration tests for similarity matching.

### Phase 4: Dashboard UI & Global Shortcut
**Goal**: Deliver a premium, responsive search interface triggered by a global keyboard shortcut.
**Depends on**: Phase 3
**Requirements**: [UI-01, UI-03, UI-04, UI-05]
**Success Criteria**:
  1. Hitting a global hotkey (e.g., `Alt + Space`) immediately summons/hides the ClipBrain overlay window.
  2. Search bar filters clipboard history by categories, favorites, and semantic text matches.
  3. Clicking or pressing Enter on an item copies it back to the clipboard and hides the window.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Build the React dashboard UI with Tailwind CSS search, filters, cards, and animations.
- [ ] 04-02: Configure Tauri window triggers, global shortcut listener, and copy-on-select functionality.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Desktop Clipboard Engine | 2/2 | Complete | 2026-07-17 |
| 2. AI Classification & Secret Security | 0/2 | Not started | - |
| 3. Local Semantic Search Engine | 0/2 | Not started | - |
| 4. Dashboard UI & Global Shortcut | 0/2 | Not started | - |
