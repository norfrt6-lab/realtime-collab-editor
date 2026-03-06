# CollabEdit — Real-Time Collaborative Editor

A Google Docs-style collaborative document editor with real-time multi-user editing using CRDTs, presence indicators, version history, comments, and conflict resolution.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Editor**: Tiptap (ProseMirror) with rich-text formatting
- **Real-Time Sync**: Y.js (CRDT) + Hocuspocus WebSocket server
- **Database**: MongoDB (documents, users, versions, comments)
- **Cache/PubSub**: Redis (multi-instance WebSocket scaling)
- **Auth**: NextAuth.js with credentials provider

## Features

- Real-time collaborative editing with conflict-free merging (CRDT)
- Live presence indicators and remote cursors
- Version history with save, browse, and restore
- Threaded comments with resolve/unresolve
- Document sharing with role-based access (owner/editor/viewer)
- Offline support with automatic sync on reconnect
- Rich text formatting: headings, lists, tables, code blocks, images, etc.
- Responsive design with keyboard shortcuts

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Setup

```bash
# Clone the repository
git clone https://github.com/norfrt6-lab/realtime-collab-editor.git
cd realtime-collab-editor

# Start MongoDB and Redis
docker compose up -d

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run both Next.js and Hocuspocus server
npm run dev:all
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run server` | Start Hocuspocus WebSocket server (port 1234) |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage report |

### URLs

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| WebSocket | ws://localhost:1234 |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

## Architecture

```
Client (Next.js + Tiptap + Y.js)
    │
    │ WebSocket
    ▼
Hocuspocus Server
    │
    ├── MongoDB (document persistence, Y.js state)
    └── Redis (pub/sub for multi-instance scaling)
```

### How Real-Time Sync Works

1. Each document is a Y.js CRDT document
2. Clients connect to Hocuspocus via WebSocket
3. Y.js automatically merges concurrent edits without conflicts
4. Changes are persisted to MongoDB via the Database extension
5. Redis pub/sub enables multiple Hocuspocus instances to stay in sync
6. IndexedDB provides offline persistence on the client

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, register pages
│   ├── api/                  # REST API routes
│   │   ├── auth/             # NextAuth + registration
│   │   └── documents/        # CRUD, versions, comments
│   ├── documents/[id]/       # Editor page
│   └── page.tsx              # Dashboard
├── components/
│   ├── editor/               # Tiptap editor + toolbar
│   ├── presence/             # Active user indicators
│   ├── comments/             # Comment threads panel
│   ├── version-history/      # Version history panel
│   └── ui/                   # Shared components
├── lib/
│   ├── auth/                 # NextAuth configuration
│   ├── collaboration/        # Y.js provider setup
│   ├── db/                   # MongoDB client + collections
│   └── redis/                # Redis client
├── hooks/                    # React hooks
└── types/                    # TypeScript types

server/
└── hocuspocus.ts             # Standalone WebSocket server
```

## License

MIT
