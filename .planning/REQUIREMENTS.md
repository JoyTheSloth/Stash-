# Requirements: ClipBrain

**Defined:** 2026-07-17
**Core Value:** Instantly find and retrieve any previously copied clipboard item using semantic natural language query search, eliminating chronological searching.

## v1 Requirements

Requirements for the initial desktop application release.

### Clipboard Core

- [ ] **CLIP-01**: Background listener detects system clipboard changes in real time.
- [ ] **CLIP-02**: Detect duplicate clipboard copies and prevent redundant entries from cluttering history.
- [ ] **CLIP-03**: Identify and store the source application/window name (if platform APIs permit).

### AI & Intelligence

- [ ] **AI-01**: Auto-categorize copied items into predefined types: API Keys, Secrets, URLs, Code, Commands, JSON, SQL, Notes, Emails.
- [ ] **AI-02**: Generate a short, context-aware smart title for each item (e.g. "MongoDB Connection String" instead of raw URI).
- [ ] **AI-03**: Generate vector embeddings for text items using a standard embeddings provider or model.

### Local Storage & Security

- [ ] **STOR-01**: Persist clipboard history, metadata, categories, and titles in a local SQLite database.
- [ ] **STOR-02**: Store and index vector embeddings locally (e.g. using `sqlite-vec` or `LanceDB`) to enable semantic search.
- [ ] **SEC-01**: Identify sensitive items (passwords, private keys, secrets) and store them encrypted locally using AES-256.

### User Interface & Desktop Experience

- [ ] **UI-01**: Responsive dashboard interface with a global query search bar, categories list, and clipboard item cards.
- [ ] **UI-02**: Package application using Tauri as a system tray app that runs in the background.
- [ ] **UI-03**: Support global hotkey (e.g. `Alt + Space` or custom) to summon/toggle the search interface.
- [ ] **UI-04**: Pin or favorite items for quick access.
- [ ] **UI-05**: Copy items back to the clipboard on click or select.

## v2 Requirements

Deferred features for future development.

### Collaboration & Advanced Detection

- **COLL-01**: Peer-to-peer or encrypted cloud sync across multiple user devices.
- **COLL-02**: Team-shared clipboards with role-based access.
- **IMG-01**: Extract text content from copied images using local OCR.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud Database Storage | Out of scope to ensure user privacy, data security, and local-first architecture. |
| Web app hosting | ClipBrain must monitor system clipboard background events which browser sandboxes block. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLIP-01 | Phase 1 | Pending |
| STOR-01 | Phase 1 | Pending |
| SEC-01  | Phase 1 | Pending |
| UI-02   | Phase 1 | Pending |
| CLIP-02 | Phase 2 | Pending |
| CLIP-03 | Phase 2 | Pending |
| AI-01   | Phase 2 | Pending |
| AI-02   | Phase 2 | Pending |
| AI-03   | Phase 3 | Pending |
| STOR-02 | Phase 3 | Pending |
| UI-01   | Phase 4 | Pending |
| UI-03   | Phase 4 | Pending |
| UI-04   | Phase 4 | Pending |
| UI-05   | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-17*
*Last updated: 2026-07-17 after initial definition*
