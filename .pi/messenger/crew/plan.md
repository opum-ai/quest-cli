Now I have enough context. Let me produce the task breakdown:

---

## 1. PRD Understanding Summary

**Request:** "Scan this repo for TODO comments. Keep it simple."

This is a straightforward code reconnaissance task. The goal is to:
- Search the quest-cli repository for TODO-like comments (TODO, FIXME, HACK, XXX, NOTE patterns)
- Exclude dependency directories (node_modules, .pi, archive)
- Report findings in a human-readable format with file paths, line numbers, and comment text
- Keep the scan and reporting process simple — no complex analysis or categorization

The task is self-contained with no downstream dependencies. It's a one-wave, non-parallelizable task.

---

## 2. Relevant Code/Docs/Resources Reviewed

- **Repository structure**: quest-cli is a TypeScript CLI project with source in `src/`, tests in `test/`, documentation in `docs/`, and backlog tracking in `backlog/`
- **Project scale**: ~7,700 lines of TypeScript across src/ and test/ directories
- **Directories to scan**: `src/`, `test/`, `docs/`, `scripts/`, `bin/` — sources and documentation only
- **Directories to exclude**: `node_modules/`, `.git/`, `.pi/`, `archive/`, `npm/`, `.claude/`, `.codex/`, `.lore/`, `.treehouse/`, `.quest/`
- **File types relevant**: TypeScript (*.ts), JavaScript (*.js), Markdown (*.md)

---

## 3. Sequential Implementation Steps

1. **Use ripgrep (rg) to search for TODO patterns** across source files, excluding dependency/config directories
2. **Collect and format results** by file path, line number, and comment text
3. **Generate a summary report** counting findings by category (TODO, FIXME, HACK, XXX) and showing details
4. **Write report to file** (TODO_REPORT.md) in the repository root
5. **Verify completeness** by checking no results were missed (no errors in rg output)

---

## 4. Parallelized Task Graph

Since this is a single scanning and reporting operation with no dependencies, there is one task only.

### Markdown Task Breakdown

```markdown
## Task 1: Scan repository for TODO comments and generate report

Scan the quest-cli repository for all TODO-like comments across source and documentation files.

**What to do:**
1. Use `rg` to search for TODO, FIXME, HACK, XXX, and NOTE patterns (case-insensitive) in:
   - `src/**/*.ts`
   - `test/**/*.ts`
   - `docs/**/*.md`
   - `scripts/**/*.ts`
   - `bin/**/*.ts`
2. Exclude node_modules, .git, .pi, archive, npm, and hidden config directories
3. Capture file path, line number, and full comment text for each match
4. Count findings by category (TODO, FIXME, HACK, XXX, NOTE)
5. Generate a summary report grouped by file

**Files to create:**
- `TODO_REPORT.md` — Human-readable summary report

**Acceptance criteria:**
- Report lists all TODO-like comments with file path, line number, and full text
- Results are grouped by file for easy scanning
- Report shows counts of each comment type (TODO, FIXME, HACK, XXX, NOTE)
- Archives and dependency directories are correctly excluded
- If no comments found, report clearly states "No TODO comments found"
- Report is concise and easy to review
```

### JSON Format

````
```tasks-json
[
  {
    "title": "Scan repository for TODO comments and generate report",
    "description": "Scan the quest-cli repository for all TODO-like comments (TODO, FIXME, HACK, XXX, NOTE patterns, case-insensitive) in source and documentation files (src/**/*.ts, test/**/*.ts, docs/**/*.md, scripts/**/*.ts, bin/**/*.ts). Exclude node_modules, .git, .pi, archive, npm, and hidden config directories. Use ripgrep (rg) to search, capturing file path, line number, and full comment text. Count findings by category. Generate a summary report (TODO_REPORT.md) grouped by file with counts of each comment type. If no comments found, clearly state that in the report.",
    "dependsOn": [],
    "skills": []
  }
]
```
````