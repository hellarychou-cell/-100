# Report, Knowledge Weeks, and Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the assessment report, add W1-W16 knowledge navigation, and connect the production deployment to the user's chosen domain.

**Architecture:** Keep report data and existing routes unchanged while adding semantic presentation hooks. Store the 16 editorial week definitions in a small shared module and let the existing client grid filter days by the selected week. Treat domain setup as a separate deployment operation after the exact domain and DNS provider are verified.

**Tech Stack:** Next.js 15, React, TypeScript, CSS, Node test runner, Vercel, Tencent Cloud/Nginx.

---

### Task 1: Lock the new report and knowledge contracts

**Files:**
- Modify: `tests/design-system-alignment.test.ts`
- Create: `tests/knowledge-weeks.test.ts`

- [ ] Add source-alignment assertions for compact report help, fact icons, dimension symbols, colored insight cards, and week navigation.
- [ ] Add data tests asserting 16 unique week groups covering Day 1-100 without gaps.
- [ ] Run `npm test -- tests/design-system-alignment.test.ts tests/knowledge-weeks.test.ts` and confirm failure because the hooks and week module do not exist.

### Task 2: Implement report refinements

**Files:**
- Modify: `src/components/AssessmentResultClient.tsx`
- Modify: `src/app/globals.css`

- [ ] Move the severity label beside `总分` and place a small `?` help mark beside it.
- [ ] Add restrained symbols to report facts and dimension rows.
- [ ] Give each dimension progress bar a stable palette tone.
- [ ] Style `核心内耗源` with pale terracotta and `优势区域` with pale sage.
- [ ] Run the focused alignment test and confirm it passes.

### Task 3: Implement W1-W16 knowledge navigation

**Files:**
- Create: `src/lib/knowledge-weeks.ts`
- Modify: `src/components/KnowledgeDayGrid.tsx`
- Modify: `src/app/knowledge/page.tsx`
- Modify: `src/app/globals.css`

- [ ] Define W1-W16 labels and exact day ranges from `成她-说明书.md`.
- [ ] Render a horizontally scrollable week selector and a current-week theme strip.
- [ ] Filter the three-column Day grid to the active week without changing Day card styling.
- [ ] Show a milestone label for W1, W2, W3, W4, W8, W12, and W16 endings.
- [ ] Run both focused tests and verify green.

### Task 4: Verify the application

**Files:**
- No production file changes.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Stop the dev server, remove `.next`, and run `npm run build`.
- [ ] Restart `npm run dev -- --port 3002` and visually inspect `/assessment/result` and `/knowledge` at 390px width.

### Task 5: Bind the production domain

**Files:**
- Modify only remote Vercel/DNS/Nginx configuration after confirmation.

- [ ] Identify the exact domain and whether it should point to Vercel or Tencent Cloud `124.222.242.203`.
- [ ] Verify the registrar/DNS provider and existing records in the authorized browser session.
- [ ] Add the domain to the chosen deployment platform.
- [ ] Before changing DNS, confirm the exact record change with the user if the provider presents a final save action.
- [ ] Verify HTTPS, `/home`, `/knowledge`, and `/assessment/result` on the custom domain.
