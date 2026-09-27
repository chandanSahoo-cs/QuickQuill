# QuickQuill — Engineering Deep Dive
*Prepared for interview defense. Grounded strictly in the uploaded codebase (`QuickQuill-main`). Anything not present in the code is explicitly marked "Not implemented in the current project" or flagged as an inference.*

---

## 1. Project Overview

QuickQuill is a real-time collaborative rich-text editor (a Google-Docs-style product) with a **Git-inspired version-control system** built on top of it. Stack:

- **Frontend/Framework**: Next.js 15 (App Router), React 19-rc, TypeScript, Tailwind + shadcn/Radix UI
- **Rich text editor**: TipTap 2 (ProseMirror wrapper) with many extensions (tables, task lists, images, callouts, slash commands)
- **Real-time collaboration layer**: Liveblocks (`@liveblocks/*`) — Yjs-based CRDT sync for the editor, plus Liveblocks Storage (LiveObject) for page margins, Liveblocks Threads for comments, Liveblocks Notifications for the inbox
- **Auth**: Clerk (`@clerk/nextjs`), including Clerk Organizations for team/workspace membership
- **Persistent backend/database**: Convex (reactive document database + serverless functions), used for documents, and a custom **content-addressable commit graph** (`documents`, `commits`, `trees`, `blobs` tables)
- **PDF export**: Puppeteer / `@sparticuz/chromium` server-side HTML→PDF rendering via a Next.js Route Handler
- **Client state**: Zustand (`useEditorStore`, `useLoadingStore`) for ephemeral UI/editor-instance state

The defining architectural idea: QuickQuill deliberately runs **two different consistency models side by side**. Live, keystroke-level collaboration is handled by Liveblocks/Yjs (an eventually-consistent CRDT built for high-frequency small deltas). Durable "save points" are handled by Convex using a **Git-like object model** (blobs/trees/commits addressed by SHA-256 content hash) that the user must explicitly trigger via a "Commit" action. This mirrors Git's separation between the working tree (fast, ephemeral, mutable) and the commit history (slow, deliberate, immutable, content-addressed).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browser (Next.js client, React 19)                                  │
│                                                                       │
│  Editor.tsx (TipTap/ProseMirror)                                     │
│    ├─ useLiveblocksExtension()  ───────► Liveblocks Yjs doc (CRDT)   │
│    ├─ useStorage/useMutation()  ───────► Liveblocks LiveObject       │
│    │      (margins - room storage)                                  │
│    ├─ useThreads() / AnchoredThreads  ─► Liveblocks Threads (comments)│
│    └─ useEditorStore (Zustand) ────────► local editor instance ref  │
└───────────────┬───────────────────────────────────┬─────────────────┘
                │ WebSocket (Liveblocks realtime)    │ HTTPS (Convex client, reactive)
                ▼                                     ▼
     ┌────────────────────┐              ┌─────────────────────────────┐
     │ Liveblocks servers  │              │ Convex backend                │
     │ (managed, multi-    │              │  documents / commits / trees │
     │  tenant, per-room)  │              │  / blobs tables               │
     │  - Yjs CRDT sync     │              │  mutation/query functions    │
     │  - Presence          │              │  reactive subscriptions      │
     │  - Threads/Comments   │              └───────────────┬───────────────┘
     │  - Notifications      │                              │ Convex auth via Clerk JWT
     └──────────┬────────────┘                              │
                │ POST /api/liveblocks-auth (custom auth)    │
                ▼                                             ▼
        ┌───────────────────────────────────────────────────────┐
        │ Next.js server (Route Handlers + Server Actions)        │
        │  - /api/liveblocks-auth   (Liveblocks session mint)     │
        │  - /api/generate-pdf      (Puppeteer HTML → PDF)         │
        │  - /api/get-org-details   (Clerk org lookup)             │
        │  - action.ts (server actions: getDocuments, getUser)     │
        │  - middleware.ts (clerkMiddleware route protection)      │
        └───────────────┬───────────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Clerk (Auth +  │
                │ Organizations) │
                └───────────────┘
```

Two independent "real-time" systems exist, not one: Liveblocks owns live document editing, presence, comments and notifications; Convex owns durable state and is *also* real-time (Convex queries are reactive/subscribed), but at a much coarser grain — document metadata, and the commit graph. There is **no server-side WebSocket service written by this project**; Liveblocks and Convex are both managed platforms that provide the transport. This is a deliberate "buy, don't build" choice discussed in depth in §10.

---

## 3. Complete Request/Data Flow

### 3.1 Opening a document
```
GET /documents/[documentId]
  → page.tsx (Server Component, "use server")
      → auth() [Clerk] gets session
      → getToken({ template: "convex" })  -- mints a Convex-scoped JWT
      → preloadQuery(api.documents.getById, { documentId }, { token })
          -- runs the Convex query on the server, serializes result
      → renders <Document preloadedDocument=...>
  → Document.tsx (Client Component)
      → usePreloadedQuery(preloadedDocument)  -- hydrates instantly, no loading flash
      → wraps children in <Room> (Liveblocks room named after documentId)
  → Room.tsx
      → LiveblocksProvider.authEndpoint → POST /api/liveblocks-auth
          -- server validates Clerk session + Convex ownership/org check,
             mints a Liveblocks access token scoped to this room
      → RoomProvider id={documentId} initialStorage={margins}
      → Editor.tsx mounts, useLiveblocksExtension() joins the Yjs doc over WS
```

### 3.2 Live typing (collaboration path)
```
User keystroke → ProseMirror transaction → TipTap Collaboration extension
  → Yjs update (local) → applied optimistically to local ProseMirror state
  → Yjs update broadcast over Liveblocks WebSocket
  → other connected clients' Yjs docs merge the update (CRDT merge, no conflict)
  → their ProseMirror views re-render
```
This path **never touches Convex**. It is entirely inside Liveblocks' infrastructure.

### 3.3 Committing (persistence path)
```
User clicks "Commit" (Navbar.tsx → onCommit)
  → editor.getJSON() (full ProseMirror document as JSON)
  → useMutation(api.commits.commitDoc)({ documentId, content })
  → Convex mutation commitDoc (commits.ts):
      1. parseEditorContentToBlocks(content) -- splits top-level doc nodes into blocks
      2. for each block: JSON.stringify → SHA-256 hash (hash.ts)
      3. dedupe against existing blobs (by_document_and_hash index) — reuse or insert
      4. insert a new `trees` row referencing the resulting blobIds array
      5. compare new blobIds array to the tree of document.currentCommitId
         -- if identical, throw ConvexError("Nothing to change")
      6. insert a new `commits` row (parentCommitId = old currentCommitId)
      7. patch `documents.currentCommitId` to the new commit
  → toast success/failure in the UI
```

### 3.4 Viewing history / diff
```
VersionControlModal → History.tsx / Diff.tsx
  → usePaginatedQuery(api.commits.getPaginatedCommit, {documentId}) 
       -- reactive, cursor-paginated list of commits, newest first
  → useQuery(api.commits.getContentByCommitId, {commitId})
       -- Convex query: commit → tree → blobs → reassembled {type:"doc", content:[...]}
  → Diff.tsx: applyDiffHighlight(commitContent, currentEditorJSON)
       -- client-side LCS diff over extracted text nodes, injects `highlight` marks
  → rendered in two read-only TipTap instances (ReadOnlyEditor.tsx)
```

### 3.5 Restoring a version
```
User clicks "Restore" → useMutation(api.commits.restoreCommit)
  → Convex: documents.currentCommitId = selected commitId  (pointer move, like `git reset`)
  → client: editor.commands.setContent(fetchedContent)
       -- this is a LOCAL ProseMirror mutation. Because the editor is wired to
          the Yjs/Collaboration extension, this local edit is captured as a
          Yjs transaction and broadcast to all connected collaborators, so
          restore propagates live to everyone in the room.
```

### 3.6 Exporting PDF
```
Navbar.onSavePdf → editor.getHTML() → POST /api/generate-pdf { fullHtml }
  → route.ts: launches headless Chromium (Puppeteer, or puppeteer-core +
    @sparticuz/chromium on Vercel) → page.setContent(fullHtml) →
    page.pdf({format:"A4", printBackground:true}) → returns PDF bytes
  → client creates a Blob URL and triggers a download
```

---

## 4. Feature-by-Feature Analysis

### 4.1 Real-time collaborative editing
- **What**: Multiple users edit the same TipTap document simultaneously with sub-second propagation and no lost keystrokes.
- **Where**: `src/components/document/Editor.tsx` (`useLiveblocksExtension`), `liveblocks.config.ts` (typed Storage/Presence/UserMeta), `src/app/documents/[documentId]/Room.tsx`.
- **How data flows**: See §3.2. TipTap's `Collaboration` extension (wrapped by `@liveblocks/react-tiptap`) binds ProseMirror to a Yjs `Y.Doc`; Liveblocks hosts and relays the Yjs updates over WebSocket and persists the CRDT state for reconnecting clients.
- **Why**: A plain "last write wins" REST-based editor would silently drop concurrent edits. CRDTs (Yjs) solve concurrent structured-text merging without a central lock and without operational-transform server logic that the team would have to write and debug themselves.

### 4.2 Presence, avatars, cursors
- **Where**: `Avatar.tsx`, `resolveUsers`/`resolveMentionSuggestions` in `Room.tsx`.
- **What**: `resolveUsers` maps Liveblocks user IDs (Clerk user IDs) to `{name, avatar, color}` fetched from Clerk via a server action (`getUser` in `action.ts`), so Liveblocks can render live cursors/avatars without duplicating a user table in Convex.

### 4.3 Comments / Threads
- **Where**: `Threads.tsx` (`AnchoredThreads`, `FloatingThreads`, `FloatingComposer` from `@liveblocks/react-tiptap`), `Inbox.tsx` (`useInboxNotifications`).
- **What**: Liveblocks' built-in Comments product anchors threads to text ranges in the ProseMirror document and stores them server-side in the Liveblocks room; the Inbox surfaces notifications (e.g., mentions, thread activity) via `useInboxNotifications`.
- **Not implemented**: Comment data is **not** mirrored into Convex. Comments/threads live entirely inside Liveblocks; there's no query in `convex/` for threads.

### 4.4 Slash commands (`/`)
- **Where**: `Editor.tsx` using `@harshtalks/slash-tiptap` (`Slash`, `SlashCmd`, `createSuggestionsItems`).
- **What**: A ProseMirror `Suggestion`-based plugin that opens a command palette on `/`, executing `editor.chain().focus().deleteRange(range).setNode(...)` style commands. This is a Notion-style block insertion UX layered onto TipTap without writing a full suggestion/plugin system from scratch.

### 4.5 Custom TipTap extensions
- `FontSizeExtension` / `LineHeightExtension` (`src/extensions/font-size.ts`, `line-height.ts`): TipTap's StarterKit doesn't ship font-size or line-height marks/attributes, so these are bespoke `Extension`s adding attributes to `textStyle`/paragraph nodes with `renderHTML`/`parseHTML` for serialization and Word-like formatting.
- `CalloutExtension` (`extensions/callout.ts`): a custom node type (info/success/warning/error) for Notion-style callout boxes, used by the slash-menu.
- `FindInDocumentExtension` (`extensions/find-in-document.ts`): a ProseMirror `Plugin` that walks the document to build `Decoration`s (highlights) for search matches, with commands `setSearchTerm`, `setCurrentMatchIndex`, `toggleCaseSensitivity`. This is implemented as **decorations**, not document mutations — critical, because search highlighting must never touch the shared Yjs document (that would corrupt collaborators' content over search text).

### 4.6 Document CRUD + search + pagination
- **Where**: `convex/documents.ts` (`create`, `get`, `getById`, `getByIds`, `renameById`, `removeById`).
- **What**: `get` uses Convex's built-in cursor pagination (`paginationOptsValidator`) plus a **search index** (`searchIndex("search_title", ...)`) for full-text title search, filtered by `ownerId` or `organizationId`. Personal documents vs. organization (team) documents are two different index paths chosen at query time based on whether the authenticated user currently has an active Clerk organization.

### 4.7 Git-like version control (the differentiator feature)
Covered in depth in §9 (database) and §12 (algorithms). Summary: every "Commit" creates immutable `blobs` (one per top-level ProseMirror block, content-addressed by SHA-256), a `trees` row (an ordered array of blob IDs = a full-document snapshot), and a `commits` row linking to a parent commit — i.e., a simplified, block-level analogue of Git's blob/tree/commit object model.

### 4.8 Diff viewer
- **Where**: `Diff.tsx`, `lib/apply-diff-highlight.ts`.
- **What**: Client-side LCS-based diff between two ProseMirror JSON documents, rendered as green (added) / red (removed) `highlight` marks in two side-by-side read-only editors.

### 4.9 PDF / JSON / HTML / Text export
- **Where**: `Navbar.tsx` (`onSaveJson`, `onSaveHTML`, `onSaveText`, `onSavePdf`), `/api/generate-pdf/route.ts`.
- **What**: Client-only exports (JSON/HTML/plain text) use `editor.getJSON()/getHTML()/getText()` and the Blob+`<a download>` browser pattern — no server round-trip needed. PDF is the one export that **must** happen server-side because there is no reliable client-side "print this exact HTML/CSS to PDF" API across browsers; Puppeteer gives pixel-faithful rendering by literally rendering the HTML in a real Chromium instance.

### 4.10 Auth & organizations
- **Where**: `middleware.ts`, `ConvexClientProvider.tsx`, `convex/auth.config.ts`, Clerk `OrganizationSwitcher`/`UserButton` in `Navbar.tsx`.
- **What**: Clerk handles authentication and multi-tenant "Organizations" (teams/workspaces). Convex trusts Clerk-issued JWTs (`auth.config.ts` points at the Clerk JWT issuer domain) so Convex functions can call `ctx.auth.getUserIdentity()` without QuickQuill running its own session/token infrastructure.

---

## 5. Database Architecture (Convex)

### 5.1 `documents`
```ts
documents: {
  title, initialContent?, ownerId, roomId?, organizationId?,
  currentCommitId?: Id<"commits">, rootCommitId?: Id<"commits">,
  createdAt, updatedAt
}
.index("by_owner_id", ["ownerId"])
.index("by_organization_id", ["organizationId"])
.searchIndex("search_title", { searchField:"title", filterFields:["ownerId","organizationId"] })
```
- **Why it exists**: root aggregate for a document — metadata, ownership, and (crucially) a pointer (`currentCommitId`) into the commit graph, exactly like a Git branch ref (`HEAD`) pointing at a commit SHA.
- **Why these fields**: `ownerId`/`organizationId` are **denormalized strings from Clerk**, not foreign keys into a local `users` table — QuickQuill deliberately does not maintain its own user table, treating Clerk as the single source of truth for identity (see §8, "Why not a users table").
- **Why these indexes**: `by_owner_id` and `by_organization_id` back the two branches of `documents.get` (personal vs. org listing) with an O(log n) index scan instead of a full collection scan + filter. The `search_title` search index backs the title search box; `filterFields` lets the search be scoped to the current owner/org in the same query instead of a post-filter over all documents (which would leak titles across tenants if done client-side).
- **What could be expensive**: none of the current query patterns are — every read is either a point read by primary key or an indexed scan. There is no `.filter()` used on unindexed fields.

### 5.2 `commits`
```ts
commits: {
  documentId: Id<"documents">, parentCommitId?: Id<"commits">,
  treeId: Id<"trees">, name, authorId, createdAt, updatedAt, commitNumber?
}
.index("by_document_id", ["documentId"])
```
- **Why**: an immutable, append-only log node. `parentCommitId` gives a linked list (currently strictly linear — no merge commits / branching UI exists, so it's a **chain**, not a DAG in practice, even though the data model *could* support a DAG). `treeId` points at the snapshot of blob IDs that make up the document at that commit.
- **Race conditions**: `commitDoc` reads `document.currentCommitId`, then later writes `documents.currentCommitId = newCommit`. Convex mutations are **transactional/serializable** (each mutation runs as a single atomic transaction against Convex's underlying storage), so two concurrent `commitDoc` calls for the same document cannot interleave their read-then-write in a way that loses an update — Convex will serialize them. This is a genuine advantage of Convex's transactional mutation model over a naive multi-request REST/SQL flow without explicit locking.
- **What could be expensive**: `getPaginatedCommit` and the `commitCount` query both scan `by_document_id`; for a document with an extremely large commit history the `commitCount = await ctx.db.query(...).collect()` call inside `commitDoc` (just to compute `commitNumber`) does an **unbounded full scan of all commits for that document on every single commit** — this is a real Currently-implemented inefficiency (see §13, "Current → Problem → Better implementation").

### 5.3 `blobs`
```ts
blobs: { hash, documentId, content, createdAt }
.index("by_document_and_hash", ["documentId", "hash"])
```
- **Why it exists / why content-addressed**: this is the storage-deduplication layer. Each ProseMirror top-level block (`type: paragraph | heading | table | ...`) is hashed with SHA-256 (`lib/hash.ts`, using `crypto.subtle.digest`) and only inserted if a blob with that `(documentId, hash)` doesn't already exist. If a user edits paragraph 3 and leaves paragraphs 1–2 untouched, the new commit's tree reuses the **same blob IDs** for 1–2 and only creates one new blob for 3 — directly mirroring how Git blobs are deduplicated by content hash across the whole repo.
- **Why hashing is scoped per-document** (`by_document_and_hash` is `(documentId, hash)`, not a global hash index): keeps blob reuse simple and avoids one document's content ever being silently aliased with another's (privacy/isolation), at the cost of losing cross-document dedup that a true global CAS (like Git's object store) would get you.
- **Trade-off**: content stored as `JSON.stringify(node)` string, not a normalized structured table — so it is opaque to Convex's own indexing/search beyond exact hash match. That's fine here because blobs are only ever looked up by hash or fetched by ID as part of tree reconstruction, never queried by content.

### 5.4 `trees`
```ts
trees: { documentId, blobIds: Id<"blobs">[], createdAt }
.index("by_document_id", ["documentId"])
```
- **Why**: a tree is the *ordered* snapshot of a document — literally an array of blob IDs in document order. Reconstructing a commit's content is `tree.blobIds.map(id => blobs.get(id))`, then `JSON.parse` each and wrap in `{type:"doc", content:[...]}` (`getContentByCommitId`). This is a simplified, single-level version of a Git tree object (Git trees can nest; here the "tree" is flat because ProseMirror documents are only one level of top-level block nodes deep for this purpose).
- **Consistency guarantee expected**: a tree's `blobIds` array must remain stable forever once a commit references it (commits are immutable, so their tree must be too) — nothing in the code ever `patch`es a `trees` row after creation, which is correct.

### 5.5 Normalization level
The schema is **already normalized to avoid storing duplicate document content per commit** (that's the entire point of blobs/trees) — this is actually a level *above* typical 3NF table normalization; it is closer to Git's own object-store normalization. The trade-off is added query fan-out: reconstructing one commit's content requires 1 (commit) + 1 (tree) + N (blobs, currently done in `Promise.all`, so parallel) reads instead of 1 read of a `content: string` column. For a text document with a handful of blocks this is negligible; for very large documents with hundreds of blocks, N parallel point-reads per version view is the real cost of the dedup.

### 5.6 Why Convex over a traditional SQL/NoSQL database
- **My approach**: Convex (a reactive document database + serverless TypeScript functions, no separate ORM/API layer).
- **Alternatives**: PostgreSQL + a REST/GraphQL API (e.g., via Prisma + tRPC/Express), or Firebase/Firestore.
- **Why Convex was preferable here**: (1) Convex queries are **reactive by default** — `useQuery`/`usePaginatedQuery` on the client automatically re-render when underlying data changes, which is exactly the "live commit list", "live document list" behavior the History/Diff panels need, without hand-rolling polling or a pub/sub layer. (2) Convex mutations are **transactional TypeScript functions**, which made the "read current tree → compare → conditionally insert commit" logic in `commitDoc` safe to write directly, without SQL transactions/locking boilerplate. (3) Schema + generated types (`convex/_generated/*`) give end-to-end type safety from `schema.ts` through `api.documents.getById` calls in React, without a separate codegen step for a REST/GraphQL layer.
- **Trade-offs accepted**: Convex is a hosted/managed platform (vendor lock-in, no raw SQL access), its query language is not full SQL (no arbitrary joins — the code compensates with sequential `ctx.db.get()` calls, e.g., commit→tree→blobs), and there's no relational query planner to fall back on for complex ad-hoc reporting.

---

## 6. API / Backend Architecture

QuickQuill has **no traditional REST/GraphQL API layer of its own** for its core domain data. Instead:
- **Domain logic** (documents, commits) = Convex `query`/`mutation` functions, called directly from React via the Convex client SDK (`useQuery`, `useMutation`, `usePaginatedQuery`) or from the server via `preloadQuery`/`ConvexHttpClient`.
- **Cross-cutting/infra concerns that don't belong in Convex** = three Next.js Route Handlers under `src/app/api/*`:
  - `POST /api/liveblocks-auth` — mints a Liveblocks session token after validating the Clerk session and checking Convex-stored document ownership/org membership. This *must* be a server route (never a Convex function) because it needs the Liveblocks **secret key**, and because Liveblocks explicitly expects a `POST /auth`-shaped HTTP endpoint for its `authEndpoint` client config.
  - `POST /api/generate-pdf` — needs a full Node.js runtime with a headless Chromium binary (`export const runtime = "nodejs"`), which Convex's function runtime doesn't provide.
  - `POST /api/get-org-details` — a thin proxy to Clerk's server SDK for organization metadata (name/slug), used by client code that shouldn't hold Clerk secret keys.
- Two **Server Actions** (`"use server"` in `action.ts`) — `getDocuments`, `getUser`, `getUserById` — used from client components (`Room.tsx`) to call Clerk's server SDK and Convex's `ConvexHttpClient` without exposing secrets to the browser. Server Actions were chosen over a dedicated `/api/*` route here purely for developer convenience (co-located, typed function call instead of `fetch` + route boilerplate) since these are simple request/response reads, not streaming or long-lived connections.

**Why REST wasn't used for documents/commits**: a REST layer would need to re-implement what Convex already gives for free — reactive subscriptions (for `useQuery`), pagination cursors, and transactional writes. Introducing REST here would mean polling or hand-rolled WebSockets just to get "the commit list updates live," which Convex already provides.

**Why cursor-based pagination (Convex's `paginationOptsValidator`), not offset pagination**: both `documents.get` and `commits.getPaginatedCommit` use it. Offset pagination (`LIMIT/OFFSET`) breaks under concurrent inserts — if a new document/commit is created while a user is on page 2, offset-based paging can show duplicate or skipped rows because the "offset" is a position in a list that just shifted. Cursor pagination anchors to a stable position (a document ID / creation order marker) so `loadMore(5)` in `History.tsx`/`Diff.tsx` always fetches the *next* items relative to what's already loaded, regardless of concurrent writes elsewhere. This matters specifically here because commits are being created by an actively-editing user while the history panel might be open.

---

## 7. WebSocket / Real-Time Architecture

### 7.1 Why real-time communication is needed
Two independent needs: (a) sub-second text synchronization across simultaneous editors, and (b) live UI updates for document lists/commit history/notifications without manual refresh.

### 7.2 Why Liveblocks (managed Yjs/WebSocket) over building a custom WebSocket service
- **My approach**: Liveblocks — a managed WebSocket + CRDT (Yjs) platform, integrated via `@liveblocks/react-tiptap`'s `useLiveblocksExtension`.
- **Alternatives realistically available**: (1) a self-hosted Yjs WebSocket server (e.g., `y-websocket` + a Node/Express process) fronting the same Yjs CRDT; (2) a fully custom OT (operational transform) server; (3) polling/long-polling the Convex document row with `initialContent` re-saved periodically (no true concurrent-edit merging).
- **Why Liveblocks was preferable**: building and *operating* a WebSocket fan-out service (connection scaling, reconnection/backoff, presence tracking, room sharding across server instances, and the Yjs merge/persistence logic itself) is a substantial distributed-systems project on its own. Liveblocks provides this as a managed product with a first-party TipTap binding (`@liveblocks/react-tiptap`), which is why the editor integration in `Editor.tsx` is a single hook call.
- **Trade-off**: recurring per-connection/per-MAU cost, vendor lock-in to Liveblocks' room/document model, and no control over the physical location of the WebSocket edge servers or fine-grained backpressure tuning that a self-hosted service could offer.

### 7.3 Why a separate real-time service instead of embedding WebSockets in the Next.js monolith
**Not applicable as "our own service"** — but the underlying architectural question ("why is the WebSocket layer separate from the app server?") still has a real, defensible answer: Next.js Route Handlers (the "monolith" here) run in a request/response, largely stateless serverless model (especially on Vercel) — they are not designed to hold long-lived WebSocket connections in-process, and horizontally scaled serverless instances can't natively share in-memory Yjs room state with each other. Separating real-time transport into a dedicated, stateful service (Liveblocks' infrastructure) sidesteps that mismatch entirely: the Next.js app only ever does short-lived request/response work (`/api/liveblocks-auth` mints a token and returns), while Liveblocks' own servers hold the long-lived connections and in-memory CRDT state.
- **Benefits of separation**: the app server can be scaled/deployed independently and stays stateless (easy to run on serverless/edge); the real-time layer can be scaled and optimized (connection pooling, room sharding) independently by a team (Liveblocks) that specializes in exactly that problem.
- **Added complexity**: two systems of record to keep mentally straight (Yjs/Liveblocks room state and Convex's persisted rows) and one additional hop for authorization (`/api/liveblocks-auth` has to re-derive "is this user allowed in this room" from Convex on every room join).

### 7.4 Connection lifecycle & auth
`LiveblocksProvider.authEndpoint` (in `Room.tsx`) calls `/api/liveblocks-auth` with `{ room: documentId }` on connect. The route (`route.ts`) re-validates the Clerk session server-side, fetches the document from Convex, and checks `isOwner || isOrganizationMember` before calling `liveblocks.prepareSession(...).allow(room, session.FULL_ACCESS)`. This means **authorization is enforced per room-join, server-side, using the current document's ownership/org data** — not just a static claim baked into a long-lived token. `throttle={16}` on `LiveblocksProvider` caps how often presence/storage updates are sent (roughly a 16ms/60fps-ish batching window) to avoid flooding the socket with every micro-update.

### 7.5 Reconnection, offline support, ordering, duplicates
- `useLiveblocksExtension({ offlineSupport_experimental: true })` in `Editor.tsx` enables Liveblocks' experimental offline buffering — local edits made while disconnected are queued and Yjs-merged on reconnect. This is a Liveblocks platform feature, not custom code.
- **Ordering/duplicate delivery**: handled entirely inside Yjs's CRDT algorithm (which is designed to converge regardless of message order or duplication) and Liveblocks' transport — QuickQuill does not implement any de-duplication logic of its own for live edits.
- **What happens on WebSocket disconnect**: Liveblocks' client automatically attempts reconnection; `ClientSideSuspense`/`FullScreenLoader` in `Room.tsx` cover the initial-connect loading state, but there is **no custom UI in this codebase for "reconnecting..." mid-session** — that's a Liveblocks client-internal concern, not something QuickQuill's components branch on explicitly. *(Inference: Liveblocks' default client behavior handles this; not verifiable from this codebase alone since it's inside the `@liveblocks/*` packages.)*

### 7.6 Broadcasting / fan-out and multiple backend instances
Because Yjs sync and fan-out happen inside Liveblocks' managed infrastructure rather than inside QuickQuill's own Next.js server processes, "what happens with multiple backend instances" is largely **Liveblocks' problem, not this app's** — the Next.js instances are stateless per request; none of them hold a room's live state, so scaling the Next.js deployment horizontally has no effect on collaboration correctness. **Not implemented in the current project**: any self-managed pub/sub broker (Redis, etc.) for fan-out — there is no Redis dependency anywhere in `package.json`.

### 7.7 Why polling/long-polling/SSE were not chosen for the editor
Polling/long-polling cannot deliver the sub-second, keystroke-level updates required for a usable collaborative editor without either high latency (poll interval) or high server load (very short intervals). Server-Sent Events (SSE) are one-directional (server→client), but collaborative editing is inherently bidirectional (every client is also a writer), so SSE alone would still need a separate write channel. WebSockets (via Liveblocks) give the single bidirectional low-latency channel this feature needs. Convex's `useQuery` reactivity (used for document lists/commit history) is closer to a push/subscribe model in spirit — but for character-level text sync it isn't used, because Convex documents are optimized for structured row data, not for holding a rapidly-mutating CRDT byte stream.

---

## 8. Frontend Architecture

### 8.1 Component structure
- `src/app/*` — Next.js App Router routes (Server Components by default; explicit `"use client"` where interactivity/hooks are needed, e.g. `Document.tsx`, `Room.tsx`, `Editor.tsx`, `Navbar.tsx`).
- `src/components/document/*` — the editor page's UI (Editor, Toolbar, Navbar, Threads, Inbox, TableMenu, FindInDocument, Avatar).
- `src/components/version-control/*` — History, Diff, ReadOnlyEditor, RenameCommit, VersionControlModal.
- `src/components/home/*` — document dashboard (search, template gallery, documents table/cards).
- `src/components/ui/*` — shadcn/Radix primitives (buttons, dialogs, dropdowns, etc.) — a design-system layer, not domain logic.
- `src/extensions/*` — custom TipTap/ProseMirror extensions.
- `src/store/*` — Zustand stores.
- `src/lib/*` — pure helper functions shared by client and Convex functions (`hash.ts`, `parse-editor-content.ts`, `apply-diff-highlight.ts`, `utils.ts`).

### 8.2 Server state vs. client state — and why three different tools are used for it
QuickQuill deliberately does **not** use one general state library for everything; each state category maps to the tool best suited to its consistency needs:
1. **Durable/server state (documents, commits)** → Convex `useQuery`/`useMutation`/`usePaginatedQuery`. This is "server state" in the React Query sense — cached, reactive, revalidated automatically by Convex's subscription protocol. No manual cache invalidation code exists anywhere in the app for this data (unlike a REST + React Query setup, where you'd write query-key invalidation after every mutation) — Convex pushes updates to subscribers automatically.
2. **Shared live collaboration state (document text, page margins)** → Liveblocks (Yjs CRDT for text; `LiveObject`-backed room `Storage` — `useStorage`/`useMutation` from `@liveblocks/react` — for `leftMargin`/`rightMargin`). This state is shared across users in the room but is *not* meant to be durable Convex history — margins aren't versioned or committed.
3. **Local/ephemeral UI + cross-component instance state** → Zustand (`useEditorStore` holds the live TipTap `Editor` instance so far-apart components like `Toolbar.tsx`, `Navbar.tsx`, `Diff.tsx`, `History.tsx` can all call `editor.chain()...` without prop-drilling the editor down through the tree; `useLoadingStore` holds a simple boolean for the initial page loading screen).

**Why not just Redux/Context for everything**: Zustand avoids Context re-render fan-out for a value (the editor instance) that changes on almost every keystroke (`onUpdate`, `onSelectionUpdate`, `onTransaction` all call `setEditor(editor)`) — with React Context, every consumer of that context would re-render on every keystroke; Zustand's selector-based subscription (`useEditorStore()`) lets only the components that actually read `editor` re-render, and even then only when the store's reference changes.

**Trade-off (a real, code-visible one)**: `Editor.tsx` calls `setEditor(editor)` in *six* different callbacks (`onCreate`, `onUpdate`, `onSelectionUpdate`, `onTransaction`, `onFocus`, `onBlur`, plus `onContentError`) — since `editor` is the same object reference returned by `useEditor()` each time, this pattern relies on components re-reading `editor.getJSON()`/`editor.state` imperatively rather than subscribing to fine-grained editor state, which is simple but means consumers can't tell *what* changed, only that "something did."

### 8.3 Optimistic updates
- **Live text edits are inherently optimistic**: Yjs applies local changes to the local document immediately, before/independent of confirmation from other peers — this is a property of CRDTs, not custom code.
- **Convex mutations** (`commitDoc`, `renameById`, `removeById`, `restoreCommit`) are called with `.then()/.catch()` and toast notifications (`sonner`) on success/failure; the UI does **not** optimistically show a new commit before the mutation resolves — `History`/`Diff` panels rely on Convex's reactive `usePaginatedQuery` to reflect the new commit once it's actually written. **Not implemented**: manual optimistic UI (e.g., pushing a fake commit into local state before the server confirms) for the commit-history views — Convex's own reactivity makes this largely unnecessary since round-trip latency to reflect a write is typically small, but it does mean the commit button has no instantaneous visual feedback of *the new row appearing* beyond the toast.

### 8.4 Loading/error states
- `ClientSideSuspense` (Liveblocks) + `FullScreenLoader` component cover the Liveblocks room's initial connect.
- `usePreloadedQuery` (`Document.tsx`) avoids a loading flash for the initial document fetch because the data is fetched server-side (`preloadQuery`) before the client ever renders.
- `AuthLoading`/`Authenticated`/`Unauthenticated` (Convex + Clerk, in `ConvexClientProvider.tsx`) branch the entire app tree on auth status, showing `AuthLayout` (sign-in) vs. `FullScreenLoader` vs. the real app.
- `error.tsx` (App Router error boundary) exists at the app root for uncaught render errors (e.g., `Document.tsx` explicitly `throw`s if `!document`).
- Convex mutation failures are caught and surfaced via `sonner` toasts (`toast.error/toast.warning/toast.success`) throughout `Navbar.tsx`, `History.tsx`, `Diff.tsx`.

### 8.5 Rendering & performance choices
- The read-only diff/history views render a **separate TipTap editor instance per pane** (`ReadOnlyEditor.tsx`) rather than trying to reuse/branch the live collaborative editor — keeps the collaborative Yjs-bound editor's extension set (`Collaboration`, comments, etc.) completely isolated from static, non-collaborative preview rendering, avoiding any risk of accidentally writing preview content into the shared Yjs doc.
- `framer-motion` is used broadly for entrance/hover/tap micro-animations (Navbar buttons, modal open/close, list items) — purely a UX-polish layer, not tied to data flow.

---

## 9. Algorithms & Data Structures

### 9.1 SHA-256 content hashing (blob deduplication)
- **Where**: `src/lib/hash.ts`, used in `documents.create` and `commits.commitDoc`.
- **Why needed**: to detect "this block's content is identical to a block already stored for this document" without a full content comparison, and to give each blob a stable, collision-resistant identifier — the same problem Git solves by SHA-1/SHA-256-hashing blob contents.
- **Why SHA-256 specifically**: available natively via the Web Crypto API (`crypto.subtle.digest`) in both the browser and Convex's V8-based function runtime, cryptographically collision-resistant, no extra dependency needed.
- **Complexity**: hashing is O(content length) per block; committing a document with `k` blocks does `k` hash computations, each proportional to that block's serialized size — overall O(total document size) per commit, which is optimal (you can't detect content changes without reading the content at least once).
- **Alternative not chosen**: a cheaper non-cryptographic hash (e.g., FNV/MurmurHash) would be faster but has a (small, non-zero) chance of collisions being treated as "same content," which for a *deduplication* mechanism could silently corrupt a commit's stored content. SHA-256's collision resistance is worth the (negligible, for block-sized text) extra CPU cost.

### 9.2 Longest Common Subsequence (LCS) diffing
- **Where**: `src/lib/apply-diff-highlight.ts` — `lcs()` and `applyDiffHighlight()`.
- **Why needed**: to compute a human-readable diff (additions in green, deletions in red) between two versions of a document for the "Compare" view.
- **What it operates on**: the text is first flattened via `extractTextNodes()` into a sequence of ProseMirror **text nodes** (not individual characters, and not full blocks) — one entry per contiguous styled text run, tagged with its `blockIndex`. The LCS/diff is then computed over that sequence of text-node strings.
- **Algorithm**: classic dynamic-programming LCS. `dp[i][j]` = length of the LCS of the first `i` nodes of the current doc and first `j` nodes of the commit doc, built with the standard recurrence (`dp[i][j] = dp[i-1][j-1]+1` if nodes match, else `max(dp[i-1][j], dp[i][j-1])`). Backtracking from `dp[m][n]` walks the table to classify each node as unchanged / added / deleted — this is the textbook Myers/Hunt–McIlroy-style LCS diff approach also used by `diff`/Git under the hood conceptually (though Git's actual diff algorithm is more sophisticated/patience-diff based; this is the simpler classic DP version).
- **Time complexity**: **O(m·n)** where `m`, `n` are the number of text nodes in the two documents being compared — both the table-fill and the backtrack. **Space complexity**: O(m·n) for the DP table (a full 2D array is allocated, not just the diagonal/rolling-row optimization).
- **Why this granularity (text-node level, not character level or whole-document level)**: character-level LCS on a multi-paragraph document would be far more expensive (m, n become the total character counts, easily 10–100x larger) for marginal readability benefit, since edits are usually made in coherent runs, not scattered single characters. Whole-document-level ("did anything change at all") would give a much less useful diff (couldn't say *what* changed). Text-node granularity is the practical middle ground actually implemented.
- **Why the DP table isn't space-optimized**: for typical document sizes (dozens to low hundreds of text nodes per document) an O(m·n) table (e.g., 200×200 = 40,000 cells) is trivially cheap; a rolling-array optimization (O(min(m,n)) space) would only matter for documents with thousands of distinct text runs, which isn't this product's realistic scale. **This is a legitimate, currently-correct trade-off for the current scale, not an oversight** — flagged here as a scalability caveat (§11), not a bug.
- **Alternative not chosen**: word-level or line-level diff (like classic Unix `diff`) — not used because the underlying data isn't line-oriented text, it's a structured ProseMirror tree; node-level diffing keeps the diff aligned with actual editable units (marks/formatting are attached per node) so highlighting can attach a `highlight` mark directly to the diffed node.

### 9.3 Content-addressable object graph (blob/tree/commit) as a data structure
- Functionally this is a **Merkle-DAG-like structure** (though in the current linear-history implementation it's really a Merkle-*chain*, since there's no merge/branch UI): each `commits` row points to exactly one `parentCommitId` (a singly linked list of commits) and one `treeId`; each `trees` row is an **array of blob references** (not hashed itself — note: the tree object's own identity is its Convex document ID, not a hash of its blob list, which is a deliberate simplification vs. real Git, where tree objects are *also* content-addressed).
- **Why array-of-IDs instead of nested pointers**: ProseMirror documents used here are effectively flat lists of top-level block nodes (paragraphs, headings, tables, etc.), so a single flat array captures the whole document's structure — there was no need for Git's recursive tree-of-trees (which exists to represent directory hierarchies), since a document isn't a filesystem.
- **Reconstruction complexity**: rebuilding a commit's content is O(number of blocks) blob reads, done in parallel via `Promise.all` (`getContentByCommitId`) — not the O(1) a single denormalized "snapshot" column would offer, but far cheaper in storage than storing a full-document copy per commit.

### 9.4 Array equality check for "no-op commit" detection
- `arraysEqual<T>()` in `commits.ts` — a simple O(n) linear scan comparing two `blobIds` arrays element-by-element (Convex `Id<>` values, which are strings/opaque IDs, compared with `===`), used to short-circuit `commitDoc` with `ConvexError("Nothing to change")` when a commit would be byte-for-byte identical to the current one. This works *because* blob IDs are already content-derived (via the SHA-256 hash lookup) — two documents with identical content necessarily produce the identical `blobIds` array, so array-equality on IDs is equivalent to (but far cheaper than) deep content comparison.

---

## 10. Authentication & Security

### 10.1 Authentication
- **Mechanism**: Clerk (`@clerk/nextjs`), session-cookie based, with `clerkMiddleware()` (`middleware.ts`) protecting all routes except static assets (via the negative-lookahead matcher) and always running for `/api` and `/trpc` paths.
- **Convex trust boundary**: `convex/auth.config.ts` registers Clerk's JWT issuer domain as a trusted provider; every Convex `query`/`mutation` handler calls `ctx.auth.getUserIdentity()` and treats a `null`/undefined result as **Unauthorized**, throwing `ConvexError("Unauthorized")` — this pattern appears consistently in `documents.ts` and `commits.ts` (e.g., `create`, `get`, `removeById`, `renameById`, `commitDoc`, `getPaginatedCommit`, `getContentByCommitId`, `renameCommit`, `restoreCommit`).
- **Server-to-Convex auth for SSR**: `page.tsx` explicitly mints a Convex-scoped Clerk JWT (`getToken({ template: "convex" })`) and passes it into `preloadQuery`, so the server-rendered initial fetch is performed *as the authenticated user*, not with elevated/service credentials.

### 10.2 Authorization (access control)
- **Ownership checks are inconsistent across mutations — a real, code-visible gap worth naming in an interview**:
  - `removeById` and `renameById` (documents.ts) explicitly check `document.ownerId !== user.subject` and throw if the caller isn't the owner.
  - `getPaginatedCommit` (commits.ts) explicitly checks document ownership.
  - **`getById` (documents.ts)** — the query used to preload the document page and to authorize Liveblocks room joins — has **no** auth/ownership check at all; any authenticated Convex client could call it with an arbitrary `documentId` and get back title/owner/commit pointers. The actual access gate for *joining the collaborative room* lives in `/api/liveblocks-auth`'s `isOwner || isOrganizationMember` check, not in `getById` itself.
  - **`getContentByCommitId`, `commitDoc`, `restoreCommit`, `renameCommit`** check that the caller is authenticated but **do not** verify the caller owns/has access to the underlying document — any authenticated user who can guess/obtain a `commitId` could read its content or (for `commitDoc`/`restoreCommit`) mutate the document's history, as long as they also know a valid `documentId`.
  - **Current implementation → Problem → Better implementation → Trade-off**: *Current*: only some Convex functions re-check `document.ownerId`/`organizationId` against `ctx.auth`. *Problem*: functions like `commitDoc`, `restoreCommit`, `renameCommit`, `getContentByCommitId`, and `documents.getById` rely on the caller already having a valid `documentId`/`commitId`, which is security-through-obscurity, not real authorization. *Better implementation*: factor a shared `assertDocumentAccess(ctx, documentId)` helper (checking `ownerId === user.subject || organizationId === user.organization_id`) and call it at the top of every document/commit-scoped function, matching the pattern already used in `removeById`/`renameById`/`getPaginatedCommit`. *Trade-off*: an extra `ctx.db.get(documentId)` read per call (minor latency cost) in exchange for closing a real authorization gap.

### 10.3 Input validation
- Convex's `v.*` validators (`v.string()`, `v.id("documents")`, `v.optional(...)`) enforce argument **shape/type** at the function boundary for every `query`/`mutation` — this is schema-level validation, not deep semantic validation.
- Application-level validation is minimal but present: `renameById`/`renameCommit` trim the title/name and reject empty strings (`if (!trimmedTitle) throw new ConvexError(...)`).
- **Not implemented**: no rate limiting, no request size caps beyond Convex's platform defaults, no server-side sanitization of editor HTML before it's sent to `/api/generate-pdf` (see §10.5).

### 10.4 Injection prevention
- Because reads/writes go through Convex's typed query builder (`ctx.db.query(...).withIndex(...)`) rather than raw SQL/string-built queries, classic SQL injection is not applicable to this codebase (there is no SQL). NoSQL-style injection (e.g., malicious operators smuggled into a filter) is likewise not applicable, since Convex's validators reject arguments that don't match the declared shape.

### 10.5 XSS / HTML generation risk (a real, code-visible concern)
- `onSavePdf` (`Navbar.tsx`) sends `editor.getHTML()` directly as `fullHtml` to `/api/generate-pdf`, which calls `page.setContent(fullHtml)` in a real headless Chromium instance and executes it. TipTap's `getHTML()` output is generally attribute/tag-constrained by the configured extension schema (not arbitrary user-typed `<script>`), which limits — but does not by design formally guarantee — what can end up in that HTML (e.g., a maliciously crafted `Link`/`Image` extension attribute value could theoretically be echoed into the rendered page). **Currently implemented**: no additional server-side HTML sanitization step exists in `route.ts` before `page.setContent`. **How I would harden it**: sanitize the HTML server-side (e.g., with a library like DOMPurify running in the Node runtime, or a strict allow-list serializer) before handing it to Puppeteer, and run the Puppeteer page in a locked-down context (no navigation, no external resource loading) since it's already headless/off-screen.

### 10.6 Secrets management
- Secrets (`LIVEBLOCKS_SECRET_KEY`, `NEXT_PUBLIC_CONVEX_URL`, Clerk secret/publishable keys) are read from `process.env` inside server-only code paths (Route Handlers, Server Actions) — never referenced inside client components. `NEXT_PUBLIC_*`-prefixed vars (Convex URL, Clerk publishable key) are, by Next.js convention, intentionally exposed to the client (they're not secrets — the Convex URL is a public endpoint and the Clerk publishable key is designed to be public).

### 10.7 File-upload security
**Not implemented in the current project** — the `Image` TipTap extension inserts images by URL (or the browser's native paste/drop into an `<img src>`), there is no file-upload endpoint in `src/app/api/*` and no storage bucket integration visible in the codebase.

### 10.8 WebSocket (Liveblocks) authentication
Already covered in §7.4 — per-room, server-validated `authEndpoint`, not a static/global token.

### 10.9 Rate limiting / CSRF
**Not implemented in the current project.** No rate-limiting middleware or library is present in `package.json` or `middleware.ts`. CSRF is substantially mitigated structurally (Convex mutations are called via the Convex client SDK using bearer-token auth, not cookie-authenticated form posts, and Clerk's session model uses same-site cookie protections by default), but there's no explicit CSRF token mechanism implemented by this project — this is standard for token/SDK-based mutation calls rather than classic form POSTs, so the risk profile is low but not zero-documented.

---

## 11. Error Handling & Reliability

- **Convex functions**: every mutation/query wraps its core logic in `try { ... } catch (error) { console.error(...); throw new ConvexError(...) }`, converting internal errors into typed, client-catchable `ConvexError`s with human-readable messages (e.g., `"Nothing to change"`, `"Failed to fetch documents"`). Client code (`Navbar.tsx`'s `onCommit`) inspects `error.data` to branch toast messaging.
- **Client-side**: `sonner` toasts surface success/failure for every mutation trigger point (commit, rename, delete, restore, new document). `error.tsx` provides an App Router error boundary at the top level. `Document.tsx` explicitly `throw`s if the preloaded document resolves to null, letting the nearest error boundary catch it rather than rendering a broken UI.

### 11.1 Failure scenarios (only ones relevant to this architecture)
- **Convex unavailable**: all `useQuery`/`useMutation` calls fail; document lists, commit history, and any mutation (commit/rename/delete/restore) become unavailable. **Live text editing itself keeps working** (it's entirely Liveblocks/Yjs), but users cannot save a new version or open a *new* document (the SSR `page.tsx` load, which needs Convex, would fail) — this split-brain resilience (collaboration survives even if the durable-storage backend is down) is a direct, positive consequence of the two-system architecture.
- **Liveblocks unavailable**: real-time sync, presence, comments, and notifications stop working; the document page would hang at `ClientSideSuspense`'s fallback (`FullScreenLoader`) since `RoomProvider`/`LiveblocksProvider` can't establish a room connection. Convex-backed features (document list, commit history if reached via a route that doesn't require the room) would be unaffected in isolation, but in practice the document editor page itself is gated behind entering the `Room`.
- **Redis unavailable**: **Not applicable** — there is no Redis in this project.
- **WebSocket disconnects mid-edit**: handled by Liveblocks' client reconnection + `offlineSupport_experimental` local buffering (see §7.5); no data loss for the disconnected user's own pending edits once reconnected and merged, assuming the tab stays open.
- **Duplicate/concurrent commit requests** (e.g., double-click "Commit," or two tabs committing near-simultaneously): `commitDoc` recomputes `commitCount` and compares `blobIds` against the *current* tree inside a single Convex transaction; Convex serializes concurrent mutations against the same document, so a second commit request that reads the updated `currentCommitId` after the first one lands will correctly chain off it (or correctly no-op if content is now identical) rather than both writing conflicting `parentCommitId`s.
- **Client crashes mid-commit**: `commitDoc` is one atomic Convex mutation — either the whole set of blob/tree/commit inserts plus the document patch happens, or none of it does (Convex transactions don't partially commit), so a crash mid-flight simply means the mutation never completes/returns, not a half-written commit graph.
- **Restore while others are editing**: `restoreCommit` moves the `currentCommitId` pointer in Convex, and the client separately calls `editor.commands.setContent(...)`, which — because the editor is Yjs-bound — is broadcast to all connected collaborators as ordinary edits. If another user is *simultaneously* typing during the restore, their concurrent Yjs edits will merge with the restored content per normal CRDT semantics (no special "lock during restore" exists) — this could produce a confusing but not corrupting result (the restore "wins" the parts it touched, live edits interleave elsewhere).

---

## 12. Scalability

Distinguishing **Currently implemented** vs **How I would scale it further**, per component, as requested.

### 12.1 Real-time editing (Liveblocks)
- **Currently implemented**: connection/room scaling, presence fan-out, and CRDT merge throughput are entirely delegated to Liveblocks' managed infrastructure — QuickQuill writes zero scaling code for this path.
- **10 users**: trivial, one small room.
- **10,000 / 1,000,000 users**: fine in aggregate *as long as they're spread across many independent rooms* (documents), since each document is its own Liveblocks room with its own connection set — this architecture doesn't have a single global hot room. The realistic bottleneck at huge scale would be **very large single documents with very many simultaneous editors in one room**, which is a Liveblocks platform-side concern, not something this codebase's code would need to change for.

### 12.2 Convex (documents/commits/blobs/trees)
- **Currently implemented**: indexed queries (`by_owner_id`, `by_organization_id`, `by_document_id`, `by_document_and_hash`) keep the common read paths O(log n) rather than full scans; cursor pagination avoids the "loading a huge list at once" problem for document lists and commit history.
- **10 users / 10,000 users**: current design comfortably handles this — per-document commit counts and per-user document counts stay in the ranges these indexes are built for.
- **1,000,000 users**: the identified weak point is `commitDoc`'s `commitCount = await ctx.db.query("commits").withIndex("by_document_id", ...).collect()` — this fetches **every** commit for a document just to count them for `commitNumber`. For documents with thousands of commits, this becomes an increasingly expensive read on every single commit (O(number of existing commits) work per new commit, i.e., O(n²) total work across a document's full commit history). **How I would scale it further**: maintain a running `commitCount` (or the highest `commitNumber`) directly on the `documents` row (a simple counter field, incremented in the same transaction) instead of recomputing it by scanning every commit.
- **Blob/tree reconstruction fan-out**: `getContentByCommitId` does one read per blob in parallel — fine at current per-document block counts; for documents with very many blocks this is more Convex reads per version-view than a single denormalized snapshot column would need. **How I would scale it further**: cache the reconstructed JSON on the `commits` row itself after first materialization (write-through cache), trading some storage duplication back for read speed on hot/old commits — effectively reintroducing partial snapshotting on top of the dedup model, which is exactly the space/time trade-off Git itself makes with periodic "packfiles."

### 12.3 PDF generation (Puppeteer)
- **Currently implemented**: a single serverless function per request launches a full headless Chromium process — no browser pooling/reuse, no queueing.
- **10 users**: fine.
- **10,000+ concurrent export requests**: **would not scale as-is** — each request pays full Chromium cold-start cost, and there's no shared browser-instance pool, no job queue, no rate limiting on this endpoint. **How I would scale it further**: move PDF generation to a background job (e.g., a queue + worker pool that reuses warm browser instances, or a dedicated PDF-rendering microservice/API such as a managed HTML-to-PDF service), with the client polling or receiving a webhook/notification when the file is ready, instead of a synchronous request/response that holds a full browser open for the duration.

### 12.4 Search (`search_title` index)
- **Currently implemented**: Convex's built-in search index, scoped by `ownerId`/`organizationId` filter fields — adequate for per-user/per-org title search at any realistic personal-workspace scale.
- **How I would scale it further**: no changes anticipated to be necessary purely from user-count growth, since search is always filtered to a bounded set (one user's or one org's documents) rather than a global index scan.

---

## 13. Code-Level Decisions (Good & Questionable)

### 13.1 Good: block-level content addressing for commits
Splitting the ProseMirror document into top-level blocks before hashing (`parseEditorContentToBlocks`) is a deliberate, non-obvious design choice — hashing the *whole document as one string* would be simpler to write but would mean **any** single-character edit anywhere invalidates and re-stores the entire document as a new blob, defeating the point of content-addressed dedup. Block-level splitting means only the blocks that actually changed produce new blobs.

### 13.2 Good: keeping Yjs/collaboration and Convex/commit history as two clearly separate systems
Rather than trying to make Convex itself the real-time transport (which it technically could partially do via reactive queries, at much higher latency and without true CRDT conflict resolution for concurrent character-level edits), the codebase accepts the complexity of two systems in exchange for using each one for what it's actually good at. This is visible directly in `Editor.tsx`: the `Collaboration` extension (via `useLiveblocksExtension`) is entirely separate from any Convex hook.

### 13.3 Questionable: `parseEditorContentToBlocks` doesn't validate its input deeply
```ts
export function parseEditorContentToBlocks(doc: any){
  if (!doc || !Array.isArray(doc.content)) return [];
  return doc.content.map((node:any) => ({ content: node }));
}
```
**Current implementation → Problem → Better implementation → Trade-off**: *Current*: accepts `any`, silently returns `[]` for malformed input. *Problem*: a malformed/empty `doc` produces zero blocks, which the caller (`commitDoc`) will still happily wrap in a tree and commit as if it were a valid (empty) snapshot — there's no explicit guard against accidentally committing an empty document over real content (e.g., if `editor.getJSON()` were ever called before the editor fully hydrated). *Better implementation*: validate the incoming `doc` against an expected ProseMirror doc shape (e.g., with a zod schema, which the project already depends on for form validation elsewhere) and reject/short-circuit commits when the block count drops to zero unexpectedly, or require an explicit confirmation. *Trade-off*: extra validation code and a slightly stricter (more failure-prone-looking) commit path, in exchange for guarding against silent data loss.

### 13.4 Questionable: authorization inconsistency across Convex functions
Already detailed in §10.2 — this is the single most interview-relevant "what would you improve" item in the codebase: some functions check document ownership, others (including content-reading and content-mutating ones) only check that *a* user is authenticated.

### 13.5 Questionable: dead/commented-out code left in `commits.ts`
An earlier, simpler version of `commitDoc` (storing raw `content: string` + a single `contentHash` directly on the commit, with no blob/tree indirection) is left commented out at the top of `commits.ts`, alongside a commented-out `getCommit` query. **Why this is worth mentioning in an interview**: it's a good artifact of the actual design evolution — it shows the author started with the *simpler* "just hash the whole document" approach and deliberately refactored to the block-level blob/tree model, which is exactly the kind of "why did you choose this over the simpler alternative" evidence interviewers look for. **Better practice**: remove dead code before treating a branch as interview-ready, or keep it explicitly in version control history instead of commented in the file — but as a discussion artifact it's genuinely useful here.

### 13.6 Questionable: `removeById` doesn't clean up `blobs`/`trees`
`documents.removeById` deletes the document and all its `commits` rows, but never deletes the `trees` or `blobs` rows those commits referenced. **Current implementation → Problem → Better implementation → Trade-off**: *Current*: only `documents` and `commits` rows are removed. *Problem*: `blobs` and `trees` rows become orphaned (unreachable, but not deleted) — silent storage growth with no cleanup path, and (minor) the `by_document_and_hash` blob index keeps entries that will never be queried again. *Better implementation*: in the same mutation, also query and delete `trees.by_document_id` and `blobs` (would need a `by_document_id` index on `blobs`, or iterate via the trees) for that document. *Trade-off*: more work done inside a single (already multi-step) delete transaction, and (if using Convex's per-transaction limits) a potential need to batch/paginate the cleanup for documents with a very large commit history rather than doing it all in one mutation call.

### 13.7 Good: decorations (not document mutations) for find-in-document
`FindInDocumentExtension` implements search highlighting purely as ProseMirror `Decoration`s inside a `Plugin`'s view state, never mutating the actual document/Yjs content to "highlight" a match. This is the correct approach in a collaborative editor — mutating the shared doc to represent one user's local search state would broadcast search UI noise to every other collaborator.

---

## 14. End-to-End Flows

### 14.1 Create → Edit → Commit → Restore (the core loop)
```
"New Document" click
  → documents.create (Convex mutation)
      - inserts documents row (currentCommitId undefined)
      - builds an initial blob/tree/commit from a default empty paragraph doc
      - patches documents.currentCommitId & rootCommitId to that first commit
  → router.push(`/documents/${id}`)
  → page.tsx SSR preload → Document.tsx → Room.tsx → Editor.tsx mounts
  → user types → Yjs/Liveblocks live-syncs to any other collaborators (no Convex write)
  → user clicks "Commit" → commits.commitDoc
      - hashes current blocks, dedupes/creates blobs, creates a tree
      - compares to previous tree; if unchanged, throws "Nothing to change"
      - creates a new commit chained off currentCommitId, moves the pointer
  → user opens "Version History" → History.tsx (usePaginatedQuery + useQuery)
      - lists commits, fetches selected commit's reconstructed content
  → user clicks "Restore"
      - commits.restoreCommit moves documents.currentCommitId back
      - editor.commands.setContent(...) applies it locally, which Yjs then
        broadcasts to all connected collaborators in real time
```

### 14.2 Compare two versions
```
Diff.tsx mounts → fetches paginated commits + selected commit content (Convex)
  → also reads editor.getJSON() for "current" (uncommitted, live) content
  → applyDiffHighlight(commitContent, liveContent)  [client-side LCS]
  → renders both in ReadOnlyEditor panes with red/green highlight marks
  → user can "Restore" straight from this view (same restoreCommit path as 14.1)
```

### 14.3 Joining a shared document as a collaborator
```
User B opens the same /documents/[id] URL
  → SSR getById (Convex) — same document row, same as User A saw
  → Room.tsx → POST /api/liveblocks-auth
      - server re-checks: is User B the owner OR in the same organization?
      - if yes: mints a Liveblocks token scoped to this room
      - if no: 401, room join fails
  → on success, User B's Yjs client syncs the current CRDT state from
    Liveblocks (which already holds User A's live, uncommitted edits)
  → both users now see and can edit the same live content;
    neither user's un-committed edits exist in Convex yet
```

---

## 15. Interview Questions + Strong Answers

### Basic
**Q: What does this project do?**
A: A real-time collaborative rich-text editor (Google-Docs-style) that also has a Git-inspired version control system — you can commit named snapshots of a document, view a paginated commit history, diff any commit against your current content with an LCS-based diff, and restore an older commit, all while multiple people can be live-editing the same document simultaneously.

**Q: Why did you build it?**
A: To combine two things that are usually separate — live collaborative editing (which most editors solve with CRDTs like Yjs) and durable version history (which most editors either don't have or implement as flat "save a copy" snapshots) — using an actual content-addressed object model similar to Git's blob/tree/commit design, rather than storing a full document copy per saved version.

**Q: Explain the architecture.**
A: Next.js app on top of two backends: Liveblocks handles everything that needs to be *instantly* consistent across collaborators (live text via Yjs CRDTs, presence, comments, notifications, and a small shared `Storage` object for page margins); Convex handles everything that needs to be *durable and queryable* (document metadata, and a commit graph of `documents → commits → trees → blobs`). Clerk handles auth for both. Route Handlers cover things neither platform can do directly: minting a scoped Liveblocks token, and running headless Chromium for PDF export.

### Intermediate
**Q: Why did you choose Convex over a SQL database + REST API?**
A: Convex gave me reactive queries (`useQuery` auto-updates the UI when data changes, no manual cache invalidation), transactional TypeScript mutations (so the read-current-tree/compare/insert-commit logic in `commitDoc` is safe under concurrency without hand-written locking), and end-to-end generated types — all without standing up a separate API/ORM layer.

**Q: Why this schema for version control (blobs/trees/commits) instead of just storing the full document JSON on every commit?**
A: Storing a full copy per commit means storage grows linearly with (document size × number of commits), and every edit — even a one-character change — duplicates the entire document. Splitting the document into top-level blocks, hashing each with SHA-256, and only storing new blobs when content actually changed means unchanged blocks are reused (referenced, not duplicated) across every commit that doesn't touch them — the same trade Git makes for files in a repo.

**Q: Why WebSockets (via Liveblocks) instead of polling Convex for live editing?**
A: Convex queries are reactive, but they're designed for structured row/document data with revalidation latency suited to UI state (document lists, commit history), not for streaming a rapidly-mutating CRDT byte stream at keystroke frequency with true concurrent-edit merging. WebSockets give the low-latency bidirectional channel collaborative text editing needs, and Yjs (via Liveblocks) gives conflict-free merging that a simple "last write wins" polling approach can't.

**Q: Why cursor-based pagination for commits and documents instead of offset pagination?**
A: Offset pagination breaks under concurrent writes — if a new commit lands while you're paging through history, offset-based paging can skip or duplicate rows because "offset 10" now points somewhere different. Convex's cursor pagination (`paginationOptsValidator`, used in `documents.get` and `commits.getPaginatedCommit`) anchors to a stable position, so `loadMore` always returns the next items relative to what's loaded, which matters here specifically because commits can be created live while the history panel is open.

**Q: Why is PDF export a server route instead of client-side?**
A: There's no reliable, pixel-faithful client-side "render this HTML+CSS to PDF" API across browsers. `/api/generate-pdf` spins up a real headless Chromium (Puppeteer, or `puppeteer-core` + `@sparticuz/chromium` on Vercel) and uses its native print-to-PDF capability, which guarantees the PDF matches what a real browser would render.

### Advanced
**Q: How would you scale this to 10 million users?**
A: The real-time editing layer already scales horizontally by nature (each document is an independent Liveblocks room, so load spreads across rooms) — that's Liveblocks' problem to solve, not code I'd need to change. On the Convex side, I'd fix the O(n) `commitCount` scan in `commitDoc` by maintaining a counter on the `documents` row instead of re-scanning all commits per commit. I'd also move PDF generation off the synchronous request path into a queued worker pool with warm browser reuse, since that's the one component doing genuinely heavy, un-pooled, per-request work.

**Q: What happens if a WebSocket server (Liveblocks) crashes/is unavailable?**
A: Live sync, presence, comments, and notifications stop working, and the editor page hangs at the room-connect loading state (`ClientSideSuspense` fallback) since it can't join a room. Crucially, this doesn't take down document storage or version history — those live in Convex and are a separate system, so users could still (in principle) reach a non-collaborative view of their data even if Liveblocks were fully down; the current UI doesn't have an explicit "offline/degraded" fallback screen for this case, but the underlying data isn't at risk.

**Q: How would you prevent duplicate commit events / duplicate requests?**
A: This is already partly handled: `commitDoc` compares the new tree's `blobIds` against the current commit's tree and throws `"Nothing to change"` if they're identical, so an accidental double-click that resends the same content is a no-op rather than a duplicate commit. For true request-level idempotency (e.g., a network retry resubmitting the exact same mutation call), Convex mutations aren't idempotent by default — I'd add an idempotency key passed from the client and checked against a recent-mutations table if this became a real problem.

**Q: How would you handle concurrent updates (two users committing at once)?**
A: Convex mutations run as serializable transactions, so two `commitDoc` calls for the same document can't interleave their read-then-write of `currentCommitId` — Convex will order them, and the second one will correctly build on top of the first (or correctly no-op if the content ends up identical). This is a genuine benefit of Convex's transactional model versus a hand-rolled multi-step REST/SQL flow.

**Q: How would you partition the database?**
A: Not currently necessary at this data volume, but if it were: `commits`/`trees`/`blobs` are already naturally shardable by `documentId` (every index and query in this codebase is already scoped by `documentId` or `by_document_and_hash`), so a document-ID-based partitioning scheme would require no query redesign — it maps directly onto the access patterns already in place.

**Q: What happens if Redis goes down?**
A: Not applicable — there's no Redis anywhere in this stack (no caching layer is implemented in the current project).

**Q: How would you make this highly available?**
A: The app itself is largely stateless (Next.js Route Handlers/Server Components), so it's already HA-friendly at the deploy layer; the two stateful dependencies (Convex, Liveblocks) are both managed platforms responsible for their own HA. The one component I'd actively redesign for availability is PDF generation, since it currently holds a synchronous request open for the full lifetime of a headless-browser render with no retry/queue — a crash there is a hard user-facing failure with no fallback today.

---

## 16. "Why Did You Build It This Way?" — Decision Summary

| Decision | Why | Alternative | Trade-off |
|---|---|---|---|
| Convex for domain data | Reactive queries + transactional mutations + generated types, no separate API layer needed | Postgres/SQL + REST/GraphQL API (Prisma/tRPC) | No raw SQL/joins; vendor-managed platform; had to hand-write multi-step reads (commit→tree→blobs) instead of a JOIN |
| Liveblocks (Yjs) for live editing | Managed CRDT + WebSocket infra with a first-party TipTap binding; avoids building/operating a real-time service | Self-hosted `y-websocket` server; custom OT server | Recurring platform cost, vendor lock-in, less control over transport internals |
| Content-addressed blob/tree/commit model | Deduplicates unchanged blocks across commits instead of copying the full doc per version (Git-inspired) | Store full document JSON string per commit | More moving parts (3 extra tables, multi-hop reconstruction) for much better storage efficiency |
| SHA-256 block hashing | Cryptographically collision-resistant, native Web Crypto API, no extra dependency | Non-cryptographic hash (murmur/FNV) | Slightly more CPU per commit for correctness guarantee that matters for dedup integrity |
| LCS diff over text nodes | Standard, correct diff algorithm; node granularity matches ProseMirror's actual editable units | Character-level diff; whole-document diff | O(m·n) time/space over node counts (not optimized further — acceptable at current scale) |
| Two separate consistency systems (Liveblocks live vs. Convex durable) | Each system is used for exactly what it's good at; explicit "commit" gives deliberate save points instead of autosave-only history | Single system trying to do both (e.g., autosaving every keystroke into Convex) | More conceptual surface area; commit history only reflects explicit user actions, not every micro-edit |
| Cursor-based pagination (documents, commits) | Stable under concurrent inserts (new commits/documents while paging) | Offset/page-number pagination | Slightly less trivial to jump to an arbitrary page number (not needed here) |
| Server-side PDF via Puppeteer | Only way to get pixel-faithful, browser-consistent PDF rendering of arbitrary editor HTML/CSS | Client-side print CSS / `window.print()` only | Heavier server cost per export; currently un-pooled/un-queued (identified scaling gap, §12.3) |
| Clerk for auth + organizations, no local `users` table | Avoids duplicating identity/session infra; org membership comes "for free" for multi-tenant docs | Custom auth + own `users`/`memberships` tables | Denormalized `ownerId`/`organizationId` strings on `documents`; any user profile data needed later must be fetched from Clerk each time, not joined locally |

---

## 17. Potential Weaknesses / Improvements (Consolidated)

1. **Authorization gaps** in several Convex functions (`getById`, `getContentByCommitId`, `commitDoc`, `restoreCommit`, `renameCommit`) that check authentication but not document ownership/org membership (§10.2) — the single highest-priority fix.
2. **O(n) commit counting** on every commit (§12.2) — should become a maintained counter.
3. **No cleanup of `blobs`/`trees` on document deletion** (§13.6) — orphaned storage growth.
4. **No sanitization** of editor-generated HTML before server-side PDF rendering (§10.5).
5. **No rate limiting** on mutation/API endpoints, including the PDF-generation route which is the most resource-expensive one.
6. **PDF generation is unpooled/unqueued**, doing a full Chromium cold start per request (§12.3).
7. **Dead/commented-out code** left in `commits.ts` (fine for a WIP branch, should be cleaned for a "final" interview-ready version).
8. **No file/image upload security model** — not implemented at all currently, so nothing to secure yet, but worth flagging if image upload is added later.

---

## 18. One-Page Project Explanation (Interview Elevator Pitch)

QuickQuill is a collaborative document editor that pairs real-time editing with an actual version-control model, rather than a flat list of autosaves. The editor itself (Next.js + TipTap/ProseMirror) is bound to a Yjs CRDT through Liveblocks, so any number of people can type into the same document at once with automatic, conflict-free merging and no central lock — that part is entirely delegated to Liveblocks' managed real-time infrastructure, including presence, comments, and notifications, because building and operating that kind of WebSocket/CRDT service from scratch is a distributed-systems project in its own right, not the interesting problem this project set out to solve.

The interesting problem is version control: when a user explicitly commits, the current ProseMirror document is split into its top-level blocks, each block is SHA-256-hashed, and only genuinely new/changed blocks are stored as `blobs` — unchanged blocks are referenced, not duplicated — while an ordered `tree` records the full snapshot as an array of blob references, and a `commit` links that tree to its parent commit, moving the document's `currentCommitId` pointer forward. That's a simplified version of Git's own blob/tree/commit object model, run on Convex, which gives reactive queries and transactional mutations so the commit-history and diff UIs stay live without any manual cache-invalidation or polling code. A client-side LCS diff algorithm compares any historical commit against the live document at the granularity of ProseMirror text nodes, highlighting additions and deletions, and restoring a version simply moves the commit pointer and replays that content back into the live, Yjs-bound editor — so a restore is itself a real-time broadcast event, not a page reload.

The system deliberately runs two different consistency models side-by-side rather than forcing everything through one: Liveblocks for anything that must be instantly, collaboratively consistent (text, presence, comments), and Convex for anything that must be durable, queryable, and explicitly versioned (documents, the commit graph). Clerk provides authentication and organization/team membership for both layers, and a small number of Next.js server routes cover the handful of things neither platform can do directly — minting a scoped, per-room Liveblocks access token after re-verifying document ownership server-side, and rendering documents to PDF with a real headless Chromium instance for pixel-accurate output. The known rough edges — inconsistent per-function authorization checks, an unbounded commit-count scan, orphaned blob/tree cleanup on delete, and an unpooled PDF-render path — are all identified, scoped, and have concrete, low-risk fixes, which is itself the kind of engineering judgment this project is meant to demonstrate.
