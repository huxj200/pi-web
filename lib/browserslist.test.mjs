import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

// AGENTS.md "Old Safari (iOS 16.2)": `/` renders entirely on the client, so one
// script chunk the browser cannot parse is a blank page. Next 16 targets Safari
// 16.4+, and only `browserslist` lowers Safari/iOS to 16.2 so that SWC turns
// class `static {}` blocks into private static fields for Next's client runtime.
// These assertions keep that lowering (and the transpile list it depends on) from
// drifting away silently: the rule lives in prose, this file is the executable half.

const NEXT_DEFAULT_ENTRIES = ["chrome 111", "edge 111", "firefox 111"];
const SAFARI_ENTRY = "safari 16.2";
const IOS_ENTRY = "ios_saf 16.2";

test("browserslist lowers Safari and iOS to 16.2 for the static-block downlevel", () => {
  const list = packageJson.browserslist;
  assert.ok(Array.isArray(list), "package.json must declare a browserslist array");
  assert.ok(list.includes(SAFARI_ENTRY), `browserslist must keep "${SAFARI_ENTRY}"`);
  assert.ok(list.includes(IOS_ENTRY), `browserslist must keep "${IOS_ENTRY}"`);
});

test("browserslist keeps the other entries at Next's defaults", () => {
  const list = packageJson.browserslist ?? [];
  for (const entry of NEXT_DEFAULT_ENTRIES) {
    assert.ok(list.includes(entry), `browserslist must keep Next's default "${entry}"`);
  }
  // A second Safari/iOS entry would make the effective target ambiguous.
  const safariEntries = list.filter((entry) => /^(safari|ios_saf)\b/.test(entry));
  assert.deepEqual(safariEntries.sort(), [IOS_ENTRY, SAFARI_ENTRY].sort(), "exactly one safari and one ios_saf entry");
  assert.equal(list.length, NEXT_DEFAULT_ENTRIES.length + 2, `browserslist must hold exactly ${NEXT_DEFAULT_ENTRIES.length + 2} entries`);
});

test("Next is the major version the 16.2 override was written for", () => {
  const nextVersion = packageJson.devDependencies?.next ?? packageJson.dependencies?.next;
  assert.ok(nextVersion, "next must be a dependency");
  const major = Number.parseInt(String(nextVersion).replace(/^[^\d]*/, ""), 10);
  assert.equal(major, 16, `Next ${nextVersion}: the static-block override targets Next 16; re-check AGENTS.md before bumping`);
});

test("mermaid packages stay in transpilePackages for their lazy diagram chunks", () => {
  // AGENTS.md: other node_modules keep their syntax unless listed in
  // transpilePackages. These two are listed for the lazily imported diagram chunks.
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const match = config.match(/transpilePackages:\s*\[([^\]]*)\]/);
  assert.ok(match, "next.config.ts must declare transpilePackages");
  const packages = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const name of ["mermaid", "@mermaid-js/parser"]) {
    assert.ok(packages.includes(name), `transpilePackages must include "${name}"`);
  }
});
