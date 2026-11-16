import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync(new URL("../app/store-controls.tsx", import.meta.url), "utf8");

test("a successful Daily Checklist save opens the persisted results screen", () => {
  assert.match(ui, /!result\.saved \|\| !result\.checklist\?\.id/);
  assert.match(ui, /setChecklistReport\(result\.checklist\)/);
  assert.match(ui, /id="checklist-saved-results" tabIndex=\{-1\}/);
  assert.match(ui, /results\?\.focus/);
  assert.match(ui, /results\?\.scrollIntoView/);
});

test("the saved checklist groups issues, done, outstanding and not-applicable items", () => {
  for (const status of ["Issue", "Done", "N/A"]) {
    assert.ok(ui.includes(`item.status === "${status}"`), `Missing result grouping for ${status}`);
  }
  assert.match(ui, /!item\.status/);
  for (const title of ["What is not right", "What is done", "Still outstanding", "Not applicable"]) {
    assert.ok(ui.includes(title), `Missing result section: ${title}`);
  }
  assert.match(ui, /Manager comment:/);
  assert.match(ui, /Back to Checklist/);
});

test("history can reopen a saved checklist while branch and date changes close outdated results", () => {
  assert.match(ui, /setChecklistReport\(row\)/);
  assert.match(ui, /View Results/);
  assert.match(ui, /setSelectedStore\(event\.target\.value\); setChecklistMessage\(null\); setChecklistReport\(null\)/);
  assert.match(ui, /setChecklistDate\(event\.target\.value\); setChecklistMessage\(null\); setChecklistReport\(null\)/);
});
