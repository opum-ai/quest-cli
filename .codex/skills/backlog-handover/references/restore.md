# Restore and execute an autonomous Quest CLI campaign

1. Read the tracker from `active.md`, or the newest incomplete campaign-specific Backlog document.
   When the tracker is a Backlog document, use `backlog doc view <tracker-id> --plain | node
   .codex/skills/backlog-handover/scripts/audit-campaign-tracker.mjs` before relying on it; this keeps
   the 200-line/32-KiB budget mechanically enforced without reading Backlog storage directly.
   Ground its live queued/in-flight tasks and dependency closure against branch, exact HEAD, dirty
   paths, worktrees, campaign refs, and locally available ahead/behind facts. Query remote state only
   when authorized delivery needs it. Reconcile stale durable state before dispatch.
2. A task is ready only when eligible, dependencies are Done, required evidence is obtainable, no
   human decision blocks it, and it has no overlap with unrelated or in-flight work. Build conservative
   conflict edges from modified-file metadata, plans, cited concepts, shared Lore surfaces, indexes,
   and repository inspection.
3. Use up to three slots: explorers/sweepers for disjoint reads; normally two isolated writers plus
   one reviewer; three writers only with fully independent budgets. Create all worktrees from one
   pinned `dev` base.

The coordinator alone mutates Backlog, tracker, handover, Lore-generated surfaces, integration, and
remote state. Workers return task id, base/head SHA, changed paths, commands/results, findings,
residual risks, and follow-ups.

Run the execution guide once before wave mutations, record dispatch compactly, then activate and
plan each task before edits. Integrate non-conflicting work serially. Read `delivery.md` when the
first integrated result is ready. At settlement keep task evidence on tasks and one concise tracker
disposition, recompute readiness, and begin the next wave. Stop only for an actual AGENTS pause
condition or an empty queue.
