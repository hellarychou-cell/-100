# Restore Content And Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the good pre-19:00 home-state workflow while preserving later Day content work and completing Day1-7 story/card/AI-method rendering.

**Architecture:** Keep lightweight static content in `src/lib/content.ts` for client dashboards, add focused helpers for progress-grid state and Day document extraction, and render Day pages from structured content instead of placeholders. The home page regains assessment/membership branches and embeds the two-row Day grid only in the active-member state.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase client, Node test runner, ESLint.

---

### Task 1: Lock Recovery Requirements With Tests

**Files:**
- Create: `tests/day-content.test.ts`
- Create: `tests/home-progress.test.ts`
- Modify: `package.json`

- [ ] Add tests that verify Day1-7 stories are non-placeholder, every Day has a mystery card, Day7 card contains Satir/Iceberg content, progress states distinguish completed/today/tomorrow/future, and home state decisions distinguish no assessment / waiting membership / active member.
- [ ] Run `npm test` and confirm the new tests fail before implementation.

### Task 2: Add Content And Progress Helpers

**Files:**
- Create: `src/lib/day-document.ts`
- Create: `src/lib/home-state.ts`
- Modify: `src/lib/content.ts`

- [ ] Implement `getDayDocumentContent(day)` by parsing `成她-Day1-7.md` section headings into story, body note, AI method note, extra modules, and mystery card copy.
- [ ] Add `mysteryCards` data for Day1-7.
- [ ] Implement `getHomeUserState` and `getProgressCardState` as pure helpers for HomeDashboard.
- [ ] Run `npm test` and confirm helper tests pass.

### Task 3: Restore Home Workflow And Two-Row Grid

**Files:**
- Modify: `src/components/HomeDashboard.tsx`

- [ ] Reintroduce assessment and membership lookups from the 17:14 version.
- [ ] Render no-assessment and waiting-membership branches before the active dashboard.
- [ ] Render active dashboard with a two-row Day grid: completed dark, today outlined and pulsing, tomorrow pale yellow, future grey with fade.
- [ ] Ensure all string literals are valid ASCII quotes in code and Chinese text is preserved only inside strings.

### Task 4: Complete Day Page Rendering

**Files:**
- Modify: `src/app/day/[day]/page.tsx`
- Modify: `src/components/MysteryCard.tsx`
- Modify: `src/components/AIHoverTip.tsx`

- [ ] Replace placeholder story text with parsed Day document content.
- [ ] Render daily variable modules such as psychology knowledge, practice, reading, meditation, and milestone when present.
- [ ] Pass real card data into `MysteryCard` and allow story-page cards to flip.
- [ ] Replace the AI hover-only note with a small expandable one-line method note that expands from an ellipsis.

### Task 5: Fix Auth/Profile Regressions

**Files:**
- Modify: `src/components/AuthForm.tsx`
- Modify: `src/components/AssessmentProfileForm.tsx`

- [ ] Keep confirm-password, forgot-password, success popup, and redirect behavior.
- [ ] Remove unused imports.
- [ ] Save profile age consistently to Supabase when it can be parsed.

### Task 6: Verify And Sync

**Files:**
- All touched files

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start `npm run dev` and inspect the local app if build succeeds.
- [ ] Run `/Volumes/PS2000/成她/scripts/sync-to-github.sh "恢复首页状态与Day1-7完整内容"` after validation.
