import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// `next dev` writes a generated block into AGENTS.md
// (node_modules/next/dist/server/lib/generate-agent-files.js) and re-adds it
// whenever it is missing. Removing it from a diff only re-creates it later, so
// the block is committed. What must never happen is a half-written or duplicated
// block: a truncated block silently drops the "read the local Next docs first"
// instruction that the whole file depends on. These assertions guard its shape.

const AGENTS_MD = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const BEGIN = "<!-- BEGIN:nextjs-agent-rules -->";
const END = "<!-- END:nextjs-agent-rules -->";

const count = (haystack, needle) => haystack.split(needle).length - 1;

test("AGENTS.md holds exactly one nextjs-agent-rules block", () => {
  assert.equal(count(AGENTS_MD, BEGIN), 1, "exactly one BEGIN marker");
  assert.equal(count(AGENTS_MD, END), 1, "exactly one END marker");
  assert.ok(AGENTS_MD.indexOf(BEGIN) < AGENTS_MD.indexOf(END), "BEGIN must come before END");
});

test("the block markers are on their own lines", () => {
  const lines = AGENTS_MD.split("\n");
  assert.ok(lines.includes(BEGIN), "the BEGIN marker must be on a line of its own");
  assert.ok(lines.includes(END), "the END marker must be on a line of its own");
});

test("the block keeps its content", () => {
  const start = AGENTS_MD.indexOf(BEGIN) + BEGIN.length;
  const block = AGENTS_MD.slice(start, AGENTS_MD.indexOf(END));
  assert.ok(block.trim().length > 200, `block content looks truncated (${block.trim().length} chars)`);
  assert.match(block, /^# This is NOT the Next\.js you know$/m, "the block must keep its heading");
  assert.match(block, /node_modules\/next\/dist\/docs\//, "the block must keep the local docs pointer");
  assert.match(block, /generate-agent-files\.js/, "the block must keep the pointer to the generator that re-adds it");
});

test("the block is the last thing in the file", () => {
  // `next dev` appends the block at the end; anything after it would be written
  // outside the markers and could be lost on the next regeneration.
  const after = AGENTS_MD.slice(AGENTS_MD.indexOf(END) + END.length).trim();
  assert.equal(after, "", "nothing may follow the END marker");
});
