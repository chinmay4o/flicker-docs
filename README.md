# Flickerdocs

Real-time collaborative text editor. No server. No database. No auth. Two browsers connect over WebRTC and stay in sync with a CRDT.

---

## What it is

- Open a doc → get a unique URL
- Share the URL → peer joins directly via WebRTC (PeerJS signaling)
- Both peers type simultaneously → CRDT merges edits without conflict
- Remote cursors move in real time, colored by peer
- Offline edits sync on reconnect

No login. No persistence. Close the tab, doc is gone.

---

## How it works

Three files do all the interesting work (in `lib/`):

| File | Role |
|---|---|
| `identifier.js` | Fractional identifiers — every character gets a globally unique, totally ordered ID. Insert between any two IDs without renumbering. |
| `versionVector.js` | Causality tracking — skip operations already applied, apply ones that are new. |
| `crdt.js` | Document state — sorted array of `(char, id)` pairs. Inserts by ID, deletes by ID. Two replicas applying the same ops in any order land in the same state. |

The scheme is in the Logoot family (fractional position identifiers). Convergence holds because every operation is keyed by a globally unique identifier and the version vector deduplicates. No coordinator required.

Full writeup on the `/how-it-works` page when running the app.

---

## Stack

- **CRDT** — custom Logoot-family fractional identifiers + version vectors
- **WebRTC** via PeerJS (peer-to-peer transport, PeerJS server for signaling only)
- **CodeMirror 5** — editor surface
- **Express + Pug** — serving + routes
- **Vanilla JS** — no React, no framework, no build assist
- **Webpack** — bundles `lib/` for the browser

---

## Run locally

```bash
npm install
npm run build   # webpack bundle
npm start       # express on :3000
```

Open `http://localhost:3000` in two tabs. Both tabs share the same doc ID from the URL — edits sync in real time.

For local dev with watch:

```bash
npm run local   # nodemon + webpack --watch
```

---

## Project structure

```
lib/
  crdt.js           document state, insert/delete
  identifier.js     fractional identifier generation
  versionVector.js  causality tracking
  broadcast.js      WebRTC peer messaging
  char.js           character + identifier wrapper
  controller/       wires CRDT ↔ editor ↔ network
  editor/           CodeMirror integration, remote cursors

views/              Pug templates
public/css/         styles
app.js              Express routes
```

---

## Limitations

Fractional identifiers grow under adversarial edit patterns (many peers, all inserting at the same position). This is a known Logoot limitation. LSEQ (Nédelec et al., 2013) solves it with adaptive allocation — not implemented here.

For a real product at scale: use [Yjs](https://github.com/yjs/yjs). I built this from scratch to understand the primitives, not to ship it.

---

## Papers

- Shapiro et al., 2011 — *A comprehensive study of Convergent and Commutative Replicated Data Types*
- Preguiça et al., 2009 — *Logoot: A Scalable Optimistic Replication Algorithm for Collaborative Editing*
- Nédelec et al., 2013 — *LSEQ: an Adaptive Structure for Sequences in Distributed Collaborative Editing*

---

Built by [Chinmay](https://github.com/chinmay4o)
