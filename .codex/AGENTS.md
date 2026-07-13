# Codex Multi-Agent Guide

This file supplements the root `AGENTS.md` for Codex CLI sessions in this repo.

## Default Flow

1. Use `explorer` to map unfamiliar routes/components without editing.
2. Use `planner` before multi-file changes.
3. Use `implementer` only for a narrow file scope, such as one route or one component folder.
4. Use `reviewer` before finalizing TSX, CSS, routing, accessibility, or security-sensitive changes.
5. Use `docs_researcher` when framework or library behavior may have changed.

## Context Discipline

Keep context repo-local. Read `.ai/context.md` first, then only the files needed for the task. Put long plans, research notes, and reviews in `.ai/reports/` so future sessions can resume without carrying chat history.

## Suggested Prompts

```text
/agent planner
Plan the change for app/portfolio/projects and src/Components/Homepage only.
Write the plan to .ai/reports/projects-refresh-plan.md.
```

```text
/agent reviewer
Review the current diff for React correctness, accessibility, route behavior, and missing verification.
Do not edit files.
```
