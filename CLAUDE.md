# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This repository has no code yet. It is the workspace for **"Os Personagens da Bíblia"**, a website being planned for the Paróquia da Póvoa de Santa Iria: an interactive graph of biblical characters, navigable chronologically, showing relationships, scripture references, and each character's significance — built to be usable by children in catechism.

Read `handover.md` before doing anything else — it has the full session history, decisions made, and open questions. There are no build, lint, or test commands because there is nothing to build yet.

## Decisions already made (don't re-litigate without asking)

- Full Catholic biblical canon in scope (including deuterocanonical books), not a restricted list.
- Interaction style is free graph exploration — no quizzes, points, or missions.
- No fixed deadline; scale ambition is "as complete as possible" over time, not a small fixed MVP.
- Target stack: static site, content kept in a simple data file (e.g. JSON) separate from the rendering code, free hosting — chosen because the project owner has no programming background and needs to be able to maintain content herself eventually.
- A working prototype ("Constelação Bíblica" — 20 characters from Genesis/Exodus, dark-theme constellation-map visualization, self-contained SVG/JS with no external libraries) exists only as a published Artifact, not as files in this repo. See `handover.md` for the link and for whether it has since been pulled into the repo.

## Plugins enabled for this project

`.claude/settings.json` enables `superpowers` (obra/superpowers-marketplace skills library, confirmed active via `/plugin`) and `frontend-design` (official marketplace, for interface/visual design work). Both require a Claude Code session restart to activate if the settings file was just created or edited.
