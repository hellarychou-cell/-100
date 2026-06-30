import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("core pages use the shared mobile top bar", () => {
  const files = [
    "src/components/HomeDashboard.tsx",
    "src/app/treasure/page.tsx",
    "src/app/day/[day]/page.tsx",
    "src/components/AIDayClient.tsx",
    "src/components/CollectionClient.tsx",
    "src/components/GrowthArchiveClient.tsx",
    "src/app/knowledge/page.tsx",
    "src/app/body-station/page.tsx",
  ];

  for (const file of files) {
    assert.match(read(file), /<MobileTopBar/, `${file} should use MobileTopBar`);
  }
});

test("design tokens match the Chengta Figma palette", () => {
  const css = read("src/app/globals.css").toLowerCase();
  for (const color of ["#f2efea", "#f7f3ee", "#b89a8b", "#cdb69a", "#9ea897", "#d9a07f", "#3f3a36", "#6e5a4b"]) {
    assert.match(css, new RegExp(color), `${color} should exist in the global tokens`);
  }
});

test("product naming and treasure entries stay aligned", () => {
  const navigation = read("src/lib/product-navigation.ts");
  const collection = read("src/components/CollectionClient.tsx");
  const footer = read("src/components/DayFooter.tsx");

  for (const title of ["成长档案", "知识库", "身体驿站", "神秘卡册", "测评结果"]) {
    assert.match(navigation, new RegExp(`title: "${title}"`));
  }
  assert.doesNotMatch(collection, /我的集卡/);
  assert.match(collection, /title="神秘卡册"/);
  assert.match(footer, /今日看见卡/);
});

test("the shared header matches the approved Figma geometry", () => {
  const css = read("src/app/globals.css");
  const component = read("src/components/MobileTopBar.tsx");

  assert.match(css, /\.mobile-topbar\s*\{[\s\S]*height:\s*56px/);
  assert.match(css, /\.mobile-topbar\s*\{[\s\S]*padding:\s*0 20px/);
  assert.match(css, /\.mobile-topbar__brand\s*\{[\s\S]*font-size:\s*18px/);
  assert.match(css, /\.mobile-topbar__title\s*\{[\s\S]*font-size:\s*16px/);
  assert.match(css, /\.mobile-topbar__action\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(component, /mobile-topbar__leaf/);
});

test("the public homepage follows the single-CTA Figma draft", () => {
  const page = read("src/app/page.tsx");

  assert.match(page, /100天，/);
  assert.match(page, /把她还给她/);
  assert.match(page, /开启我的100天旅程/);
  assert.match(page, /href="\/auth\?mode=register"/);
  assert.doesNotMatch(page, />\s*登录\s*</);
  assert.doesNotMatch(page, />\s*注册\s*</);
});

test("the home dashboard keeps the approved Figma card hierarchy", () => {
  const dashboard = read("src/components/HomeDashboard.tsx");

  for (const className of [
    "home-status__summary",
    "home-status__recommendation",
    "home-status__phase",
    "home-status__days",
  ]) {
    assert.match(dashboard, new RegExp(className));
  }
  assert.match(dashboard, /title="我的状态"/);
  assert.match(dashboard, /我的匣子/);
});

test("public and auth shells adapt cleanly to tall phone screens", () => {
  const css = read("src/app/globals.css");

  assert.match(css, /\.public-home__canvas\s*\{[\s\S]*min-height:\s*100svh/);
  assert.match(css, /@media \(min-height: 760px\) and \(max-width: 640px\)/);
  assert.match(css, /\.auth-shell__hero\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) 154px/);
  assert.match(css, /\.auth-shell__portrait\s*\{[\s\S]*width:\s*154px[\s\S]*height:\s*154px/);
});

test("treasure page follows the five-entry Figma archive layout", () => {
  const page = read("src/app/treasure/page.tsx");

  assert.match(page, /treasure-page__hero/);
  assert.match(page, /treasure-page__metrics/);
  assert.match(page, /treasure-page__entries/);
  assert.match(page, /drawerItems\.map/);
});

test("daily content and AI chat use their approved mobile shells", () => {
  const day = read("src/app/day/[day]/page.tsx");
  const ai = read("src/components/AIDayClient.tsx");

  assert.match(day, /day-page__hero/);
  assert.match(day, /day-page__section/);
  assert.match(day, /day-page__mystery/);
  assert.match(ai, /ai-chat__conversation/);
  assert.match(ai, /ai-chat__composer/);
  assert.match(ai, /companionLabel/);
  assert.match(ai, /ai-chat__method-tip/);
  assert.match(ai, /getAIQuadrantTooltip/);
  assert.match(read("src/app/globals.css"), /\.ai-chat__input-hint\s*\{[\s\S]*text-align:\s*right/);
});

test("collection keeps sister cards as front-only and tool cards as full reading sheets", () => {
  const collection = read("src/components/CollectionClient.tsx");
  const css = read("src/app/globals.css");

  assert.doesNotMatch(collection, /翻到工具卡/);
  assert.doesNotMatch(collection, /翻回姐妹卡/);
  assert.match(collection, /翻到姐妹卡/);
  assert.match(collection, /姐妹卡未解锁/);
  assert.match(collection, /collection-modal__scroll-copy/);
  assert.match(css, /\.collection-modal__sheet\s*\{[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.collection-modal__sheet--tool \.collection-modal__origin\s*\{[\s\S]*display:\s*none/);
  assert.match(collection, /is-collapsed-card-peek/);
  assert.match(css, /\.collection-page__section\.is-collapsed-card-peek \.collection-page__grid\s*\{[\s\S]*max-height:\s*106px/);
  assert.match(css, /\.collection-page__section--sister\.is-collapsed-card-peek \.collection-page__grid\s*\{[\s\S]*max-height:\s*116px/);
});

test("curtain call is rendered as a hidden pull-up stage instead of a numbered section card", () => {
  const day = read("src/app/day/[day]/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(day, /CurtainCallStage/);
  assert.doesNotMatch(day, /title="整天散场尾韵 🌙"/);
  assert.match(css, /day-page__curtain-gate/);
  assert.match(css, /day-page__curtain-overlay/);
});

test("secondary product pages share the Figma mobile page shells", () => {
  const files = {
    "knowledge-page": "src/app/knowledge/page.tsx",
    "body-station-page": "src/app/body-station/page.tsx",
    "growth-archive": "src/components/GrowthArchiveClient.tsx",
    "collection-page": "src/components/CollectionClient.tsx",
    "seeing-card-page": "src/components/QuoteCardClient.tsx",
  };

  for (const [className, file] of Object.entries(files)) {
    assert.match(read(file), new RegExp(className), `${file} should use ${className}`);
  }
  assert.match(read("src/app/globals.css"), /\.knowledge-page > section:last-child aside\s*\{[^}]*align-items:\s*flex-start/);
  assert.match(read("src/app/globals.css"), /\.knowledge-page > section:last-child,[\s\S]*align-content:\s*start/);
});

test("assessment, password reset, and gate states use final mobile shells", () => {
  const profile = read("src/app/assessment/profile/page.tsx");
  const flow = read("src/components/AssessmentFlow.tsx");
  const result = read("src/app/assessment/result/page.tsx");
  const forgot = read("src/app/auth/forgot-password/page.tsx");
  const gate = read("src/components/AuthGate.tsx");

  assert.match(profile, /assessment-profile-page/);
  assert.match(flow, /assessment-flow/);
  assert.match(result, /assessment-result-page/);
  assert.match(forgot, /forgot-password-page/);
  assert.match(gate, /gate-notice/);
  assert.match(read("src/app/globals.css"), /\.forgot-password-page\s*\{[\s\S]*min-height:\s*100svh/);
});

test("feedback pass preserves the detailed Figma information hierarchy", () => {
  const profilePage = read("src/app/assessment/profile/page.tsx");
  const profileForm = read("src/components/AssessmentProfileForm.tsx");
  const home = read("src/components/HomeDashboard.tsx");
  const knowledge = read("src/app/knowledge/page.tsx");
  const knowledgeGrid = read("src/components/KnowledgeDayGrid.tsx");
  const day = read("src/app/day/[day]/page.tsx");
  const reflection = read("src/components/SelfReflectionBox.tsx");
  const growth = read("src/components/GrowthArchiveClient.tsx");
  const report = read("src/components/AssessmentReportView.tsx");

  assert.match(profilePage, /assessment-profile-page__notice/);
  assert.match(profileForm, /assessment-profile-form__field/);
  assert.match(profileForm, /assessment-profile-form__skip/);
  assert.match(home, /home-status__day-card/);
  assert.match(`${knowledge}\n${knowledgeGrid}`, /knowledge-page__phase-tabs/);
  assert.match(knowledge, /knowledge-page__progress/);
  assert.match(knowledgeGrid, /knowledge-day-card/);
  assert.match(day, /day-page__mirror-details/);
  assert.match(day, /SelfSeeingPrompt/);
  assert.match(reflection, /self-reflection--compact/);
  assert.match(growth, /growth-archive__summary/);
  assert.match(report, /assessment-report__paper/);
  assert.match(report, /assessment-report__meta/);
});

test("latest polish adds active knowledge links and expandable growth dimensions", () => {
  const knowledge = read("src/components/KnowledgeDayGrid.tsx");
  const growth = read("src/components/GrowthArchiveClient.tsx");
  const css = read("src/app/globals.css");

  assert.match(knowledge, /href=\{`\/day\/\$\{item\.day\}`\}/);
  assert.match(knowledge, /knowledge-theme-map-toggle/);
  assert.match(growth, /openDimension/);
  assert.match(growth, /createGrowthDimensionInsight/);
  assert.match(css, /\.day-page__mirror-details summary\s*\{[\s\S]*text-align:\s*right/);
  assert.match(css, /\.growth-archive__hero-copy\s*\{[\s\S]*max-width:\s*60%/);
});

test("second detail pass follows the final Figma page hierarchy", () => {
  const css = read("src/app/globals.css");
  const flow = read("src/components/AssessmentFlow.tsx");
  const growth = read("src/components/GrowthArchiveClient.tsx");
  const home = read("src/components/HomeDashboard.tsx");
  const treasure = read("src/app/treasure/page.tsx");

  assert.doesNotMatch(css, /\.knowledge-page\s*>\s*header\s*,/);
  assert.match(flow, /assessment-flow__header/);
  assert.match(flow, /assessment-flow__question-number/);
  assert.match(flow, /assessment-flow__scale-guide/);
  assert.match(growth, /growth-profile-panel__dimensions/);
  assert.match(growth, /growth-profile-panel__signals/);
  assert.match(growth, /growth-profile-panel__quote/);
  assert.match(growth, /growth-archive__record-columns/);
  assert.match(read("src/components/AssessmentReportView.tsx"), /assessment-report__score-visual/);
  assert.match(read("src/components/AssessmentReportView.tsx"), /assessment-report__object/);
  assert.match(home, /第一阶段觉醒期/);
  assert.match(home, /home-status__progress-copy/);
  assert.match(treasure, /treasure-page__icon-mark/);
  assert.match(css, /\.treasure-page__icon\s*\{[^}]*border:\s*0/s);
});

test("report polish and weekly knowledge navigation have stable UI hooks", () => {
  const report = read("src/components/AssessmentReportView.tsx");
  const knowledge = read("src/components/KnowledgeDayGrid.tsx");
  const css = read("src/app/globals.css");

  assert.match(report, /assessment-report__severity/);
  assert.match(report, /assessment-report__help/);
  assert.match(report, /assessment-report__fact-icon/);
  assert.match(report, /assessment-report__dimension-symbol/);
  assert.match(report, /tone="drain"/);
  assert.match(report, /tone="strength"/);
  assert.match(knowledge, /knowledge-week-nav/);
  assert.match(knowledge, /knowledge-week-theme/);
  assert.match(css, /\.assessment-report__insight-card\.is-drain/);
  assert.match(css, /\.assessment-report__insight-card\.is-strength/);
});
