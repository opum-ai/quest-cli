# Task for crew-planner

Create a task breakdown for implementing this request.

## Request

Scan this repo for TODO comments. Keep it simple.

## Previous Planning Context
# Planning Progress

## Notes
<!-- User notes here are read by the planner on every run.
     Add steering like "ignore auth" or "prioritize performance". -->


---
## Run: 2026-08-29T12:54:55.585Z — Scan this repo for TODO comments and report what you find...

---
## Run: 2026-08-29T13:00:10.640Z — Scan this repo for TODO comments and report what you find...

---
## Run: 2026-08-29T13:05:10.227Z — Scan this repo for TODO comments and report what you find...

### Pass 1 (13:05)
## 3. Sequential Implementation Steps

This is a simple reconnaissance task with one main step:

1. **Search for TODO comments** across all source files in the repository (excluding node_modules, .git, archives)
2. **Collect and organize results** by file path and line number
3. **Generate a summary report** with counts and grouped findings

No dependencies between steps—this is a single-wave task.

## 4. Parallelized Task Graph

Since this request is straightforward, there's only **one task**: scan and report. No parallelization is needed.

### Markdown Task Breakdown

```markdown
## Task 1: Scan repository for TODO comments and generate report

Scan the quest-cli repository for all TODO comments (case-insensitive: "TODO", "FIXME", "HACK", "XXX", "NOTE", etc.) in source files (*.ts, *.tsx, *.js, *.jsx, *.py, *.md).

**What to do:**
- Use `rg` or similar to search for TODO patterns across the codebase
- Exclude node_modules, .git, .pi, archive directories from search
- Collect results with file path, line number, and comment text
- Group findings by file or by type (TODO, FIXME, HACK, etc.)
- Generate a human-readable summary report

**Files to create:**
- `TODO_REPORT.md` — Summary report with findings organized by file or category

**Acceptance criteria:**
- All TODO-like comments in source files are identified
- Report shows file path, line number, and full comment text
- Archives and dependency directories are excluded
- Report is concise and easy to scan
- If no TODOs found, report states that clearly
```

### JSON Format

```tasks-json
[
  {
    "title": "Scan repository for TODO comments and generate report",
    "description": "Scan the quest-cli repository for all TODO comments (case-insensitive: TODO, FIXME, HACK, XXX, NOTE, etc.) in source files (*.ts, *.tsx, *.js, *.jsx, *.py, *.md). Use rg or similar to search across the codebase, excluding node_modules, .git, .pi, and archive directories. Collect results with file path, line number, and comment text. Group findings by file or by type. Generate a human-readable summary report (TODO_REPORT.md) that shows file path, line number, and full comment text. If no TODOs are found, state that clearly in the report.",
    "dependsOn": [],
    "skills": []
  }
]
```


You must follow this sequence strictly:
1) Understand the request
2) Review relevant code/docs/reference resources
3) Produce sequential implementation steps
4) Produce a parallel task graph

Return output in this exact section order and headings:
## 1. PRD Understanding Summary
## 2. Relevant Code/Docs/Resources Reviewed
## 3. Sequential Implementation Steps
## 4. Parallelized Task Graph

In section 4, include both:
- markdown task breakdown
- a `tasks-json` fenced block with task objects containing title, description, and dependsOn.