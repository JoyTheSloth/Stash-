# CLAUDE.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

Stash is an AI-powered clipboard memory that automatically monitors system clipboard events in the background, stores the content locally on the user's machine, and enables semantic search (natural language search) for instant retrieval.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Frontend**: React, Tailwind CSS
- **Desktop Wrapper**: Electron (Node.js backend)
- **Database**: Local JSON storage
- **Local Security**: AES-256 for encrypting local secrets
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Electron IPC**: Handle IPC asynchronously.
- **Node.js Backend**: Safe memory management, minimize CPU usage when polling/monitoring the system clipboard.
- **Local-first Security**: Secrets and keys are never stored in plain-text or sent to external servers.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Electron is the desktop application host. A Node.js background process monitors the system clipboard loop. When changes are detected, content is categorized, titles generated, and written to local database storage. The React frontend interfaces with Electron preload invoke/listen to fetch history and render items.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
