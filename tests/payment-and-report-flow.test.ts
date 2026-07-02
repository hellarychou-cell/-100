import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("assessment report uses the real booking QR image", () => {
  const reportView = read("src/components/AssessmentReportView.tsx");

  assert.match(reportView, /\/images\/wechat-admin-qr\.jpg/);
  assert.match(reportView, /扫码预约解读/);
});

test("assessment report displays the normalized 100-point score", () => {
  const reportView = read("src/components/AssessmentReportView.tsx");

  assert.match(reportView, /result\.totalScore100/);
  assert.match(reportView, />\/ 100</);
  assert.doesNotMatch(reportView, /\/ 180/);
});

test("assessment core insight has a compact expandable teaser", () => {
  const reportView = read("src/components/AssessmentReportView.tsx");

  assert.match(reportView, /assessment-report__insight-toggle/);
  assert.match(reportView, /summary\.bottomCode/);
  assert.match(reportView, /\.\.\./);
});

test("paid member gate tells users how to contact the admin", () => {
  const gate = read("src/components/AuthGate.tsx");

  assert.match(gate, /请添加管理员微信：tianxin0995，联系开通后面的内容/);
});

test("admin user reports render the same report view as the frontend result page", () => {
  const frontend = read("src/components/AssessmentResultClient.tsx");
  const adminReport = read("src/app/admin/users/[userId]/page.tsx");

  assert.match(frontend, /AssessmentReportView/);
  assert.match(adminReport, /AssessmentReportView/);
  assert.doesNotMatch(adminReport, /getOverallInfo/);
});

test("assessment result save button uses the PNG export helper", () => {
  const frontend = read("src/components/AssessmentResultClient.tsx");
  const exporter = read("src/lib/export-image.ts");

  assert.match(frontend, /onClick=\{\(\) => void saveReportImage\(reportRef\.current, setSaving, setSaveMessage\)\}/);
  assert.match(frontend, /fileName: `成她100-底层代码诊断报告-\$\{Date\.now\(\)\}\.png`/);
  assert.match(exporter, /html-to-image/);
  assert.match(exporter, /link\.download = fileName/);
  assert.match(exporter, /link\.click\(\)/);
});

test("assessment report hides action buttons from saved image", () => {
  const frontend = read("src/components/AssessmentResultClient.tsx");

  assert.match(frontend, /className="flex flex-wrap gap-3 no-print"/);
  assert.match(frontend, /filter: \(node\) => !node\.classList\.contains\("no-print"\)/);
});

test("wechat booking QR asset is committed for production", () => {
  assert.equal(existsSync(new URL("../public/images/wechat-admin-qr.jpg", import.meta.url)), true);
});
