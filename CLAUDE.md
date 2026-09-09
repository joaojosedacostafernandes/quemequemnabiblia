# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**"Os Personagens da Bíblia"** — an interactive, chronologically-navigable graph of biblical characters for the Paróquia da Póvoa de Santa Iria, built to be used by children in catechism. Free graph exploration (no quizzes/points), full Catholic canon (incl. deuterocanonical), all in **Portuguese**.

Owner: **Isabel** — no programming background. She must be able to grow the content herself by editing one data file, so simplicity of the data format trumps engineering elegance.

**Read `handover.md` before non-trivial work.** It is the authoritative session-by-session history ("Rondas"), records every decision and its *why*, and lists open questions. The current engine is the one described under **Ronda 14** onward; anything earlier in that file describes navigation engines that have since been deleted (era-strip, physics graph, galaxies) — kept only as historical record. The persistent project memory (`~/.claude/projects/.../memory/project_personagens_biblia.md`) has even more of the "why" than the handover.

## Commands

There is no build step and no framework. Everything runs from static files.

- **Node is installed but not on PATH.** Prefix `node` calls with the winget dir:
  `C:\Users\isabel.c.a.faria\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64`
- **Run the unit tests:** `node scripts/test-event-graph.js` — pure-function tests for `js/event-graph.js` (`deriveFamily` / `layoutEvent`), loaded via `new Function(...)` sandbox, no DOM needed. This is the only automated test suite.
- **Portrait similarity audit:** `node scripts/geometry-audit.js assets/retratos` — flags SVG portrait pairs with ≥60% shape overlap. Noisy (shared generic shapes count); flagged pairs need manual confirmation, never treat as a verdict. Since Ronda 15 it reports ~243 pairs by design (39 characters deliberately share 18 template faces) — that is expected, not a regression.
- **Serving the site:** `index.html` **cannot be opened via `file://`** — `fetch("data/personagens.json")` fails CORS. Serve the folder over `http://` (the `run` skill, or any static server). No dev-server file is checked in; it gets rewritten from the scratchpad each session (a `scripts/dev-server.js` is a standing candidate to add).
- **Real-browser verification:** use headless Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --remote-debugging-port=<port>`) driven over CDP with **real** mouse/touch events (`Input.dispatchMouseEvent` / `Input.dispatchTouchEvent`), never synthetic `.click()`/`dispatchEvent`. Multiple genuine bugs (hit-testing through transparent layers, missing touch handlers) were only ever caught this way. In recent Chrome, CDP `/json/new` requires **PUT**, not GET.

## Architecture

Static site, zero JS libraries (only external asset is the Google Fonts `<link>`). Content is fully separated from the engine so Isabel can edit content alone.

**`data/personagens.json` is the single source of truth** (~150 characters, ~130 edges, 40 events). Top-level keys:
- `personagens[]` — `{id, nome, tipo, retrato, tier, era, refs, resumo, contexto, relacoes, importancia, licao, citacao}`. The per-character `x`/`y` and the top-level `layout` block are **vestigial** (positions are computed at runtime now); the top-level `eras[]` array is a leftover of the removed era-strip engine.
- `edges[]` — `[from, to, type, label?]`. `type` ∈ `parent | spouse | sibling | descendant | affinity`. `parent` is directional (parent→child); the rest are treated as weak/undirected links.
- `acontecimentos[]` (the 40 timeline events, Creation → Apocalypse) — `{id, nome, era, tint, desc, importancia, mensagem, passagens[], personagens[] (ids), contexto, notas}`.

**Per-event character overrides:** a character can appear in many events (Jesus in 9) and needs *different* text per appearance. `acontecimentos[i].notas[charId]` holds the per-appearance version of resumo/importancia/licao/citacao; the base entry in `personagens[]` is the first-appearance/fallback used for search. `app.js`'s `focusChar` merges them: `Object.assign({}, base, currentEvent.notas[charId])`.

**JS modules** — each an IIFE exposing itself on `window` (and `module.exports` for Node tests), loaded via ordered `<script>` tags in `index.html`. No bundler, no imports.
- `app.js` — the **orchestrator only** (does no drawing): fetches the data, holds navigation state, runs search, the character detail panel, and pan/zoom, and wires the modules together.
- `js/timeline.js` — the always-visible curved chronological timeline of events. `init(opts)` returns `{applyOffset, jumpTo}`. `jumpTo(idx)` syncs rail + progress dots **without** firing `onEnter`; `opts.isSuspended()` lets its own drag/arrow/dot handlers stand down while inside an event (so `app.js` never has to intercept another module's events).
- `js/event-graph.js` — draws the inside of one event. Two **pure** functions (the tested core): `deriveFamily(ids, edges)` derives couples/children/weak-siblings *only* from edges filtered to that event's own characters (synthesizing an implicit union for two known parents lacking a formal `spouse` edge, e.g. Agar); `layoutEvent(ids, family)` does deterministic generational layout (BFS from those who aren't anyone's child within the event). `render(...)` measures each name with canvas `measureText` and sizes column width **per row** so no name is ever truncated.
- `js/warp-transition.js` — the "hyperspace jump" canvas effect on entering an event. `trigger(originXFrac, originYFrac, tint)`; fully disabled under `prefers-reduced-motion`.
- `js/event-icons.js` — `window.EVENT_ICONS[eventId]` → inline SVG icon per event.

**Navigation model (current):** a chronological timeline of events is the unit of navigation. Drag/arrows move along it; clicking an event triggers the warp transition and shows *all* its characters at once (no progressive reveal — this deliberately eliminated the union↔spouse cycle bug class that broke 4× in the deleted physics engine). Clicking a character opens the full detail panel; cross-references ("também aparece em") and search jump directly between events.

**Assets:** `assets/retratos/*.svg` — one 100×100 SVG portrait per character, referenced by the `retrato` field. `assets/icons/` — fallback SVG icons by character `tipo`. Content and its portrait are always authored **together** in the same task (Isabel's rule since Ronda 3).

## Decisions already made (don't re-litigate without asking)

- Full Catholic canon in scope (incl. deuterocanonical). Free graph exploration — no quizzes, points, or missions.
- No deadline; ambition is "as complete as possible" over time, not a fixed MVP.
- Stack: static site, content in a simple JSON data file separate from the engine, free hosting — because Isabel must maintain content without programming.
- Portraits are normally unique per character, **but** the 39 New-Testament/Ester characters intentionally share 18 template faces (Isabel: "não precisam de ser todas diferentes", Ronda 15).
- All UI text and content is in Portuguese.

## Established workflow (content rounds)

Each content round has followed the same flow and it works well: short brainstorm with Isabel on scope → spec in `docs/superpowers/specs/YYYY-MM-DD-<tema>-design.md` → plan in `docs/superpowers/plans/YYYY-MM-DD-<tema>.md` → execute in an **isolated git worktree** (never directly on `master`) → per-task review + final whole-branch review by a subagent (prefer `opus`) → real-browser verification (CDP, real events) + geometry audit → merge to `master` via the finishing-a-development-branch flow → update `handover.md` and project memory. One-shot migration scripts (`migrate.js`, `gen-portraits-tmp.js`, etc.) are deleted from the repo after they run, by convention.

## Plugins

`.claude/settings.json` enables `superpowers` (obra/superpowers-marketplace) and `frontend-design` (official marketplace). Editing that file requires a session restart to take effect.

## Gotchas (already discovered — don't rediscover)

- The repo lives on **Google Drive (`H:` / `I:`), which can unmount mid-session.** If a path "disappears", test `Test-Path` before assuming deletion — it usually remounts itself. Drive sync can also cause `git worktree remove` "Permission denied" (usually a lingering `node.exe`) and, rarely, a **corrupt worktree git index** (`fatal: index file corrupt`) — recover by deleting `.git/worktrees/<name>/index` and running `git reset` (never `git checkout --`/`git clean`, which would destroy uncommitted work). The working tree itself is never affected.
- An element can *paint* on top yet not *hit-test* on top when the layer architecturally above it is transparent at that point — only real CDP clicks + `elementFromPoint` reveal it.
- Verify artwork at the **real display size** (~56–90px medallions), not extreme zoom — inspecting an SVG at 900px led to "fixing" a non-problem once.
