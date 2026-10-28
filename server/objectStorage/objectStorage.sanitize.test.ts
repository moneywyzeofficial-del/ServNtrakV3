// Focused tests for the download-side hardening helpers used to neutralise
// uploaded payloads that could otherwise execute as same-origin content.
// No test framework is wired into this project, so this file is a
// self-contained assertion script. Run with:
//
//   npx tsx server/replit_integrations/object_storage/objectStorage.sanitize.test.ts
//
// Exits with code 0 when every case passes, code 1 otherwise.

import assert from "node:assert/strict";
import {
  sanitizeServedContentType,
  buildSafeFilename,
} from "./objectStorage";

type TypeCase = {
  input: string;
  expectedType: string;
  expectedDisposition: "inline" | "attachment";
  label: string;
};

const TYPE_CASES: TypeCase[] = [
  // Scriptable / dangerous → forced to octet-stream + attachment.
  { input: "text/html", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "text/html (XSS vector)" },
  { input: "TEXT/HTML", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "uppercase text/html" },
  { input: "text/html; charset=utf-8", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "text/html with charset" },
  { input: "application/xhtml+xml", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "xhtml" },
  { input: "image/svg+xml", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "svg (script-capable)" },
  { input: "application/javascript", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "javascript" },
  { input: "text/javascript", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "text/javascript" },
  { input: "application/wasm", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "wasm" },
  { input: "application/xml", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "application/xml" },
  { input: "text/xml", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "text/xml" },

  // Inline-safe → preserved with inline disposition.
  { input: "image/jpeg", expectedType: "image/jpeg", expectedDisposition: "inline", label: "jpeg" },
  { input: "image/png", expectedType: "image/png", expectedDisposition: "inline", label: "png" },
  { input: "image/gif", expectedType: "image/gif", expectedDisposition: "inline", label: "gif" },
  { input: "image/webp", expectedType: "image/webp", expectedDisposition: "inline", label: "webp" },
  { input: "image/avif", expectedType: "image/avif", expectedDisposition: "inline", label: "avif" },
  { input: "image/bmp", expectedType: "image/bmp", expectedDisposition: "inline", label: "bmp" },
  { input: "image/heic", expectedType: "image/heic", expectedDisposition: "inline", label: "heic" },
  { input: "application/pdf", expectedType: "application/pdf", expectedDisposition: "inline", label: "pdf" },
  { input: "text/plain", expectedType: "text/plain", expectedDisposition: "inline", label: "text/plain" },
  { input: "text/csv", expectedType: "text/csv", expectedDisposition: "inline", label: "text/csv" },

  // Aliases normalized to canonical inline-safe types.
  { input: "image/jpg", expectedType: "image/jpeg", expectedDisposition: "inline", label: "image/jpg alias → jpeg" },
  { input: "image/x-png", expectedType: "image/png", expectedDisposition: "inline", label: "image/x-png alias → png" },

  // Unknown → safe default (octet-stream + attachment).
  { input: "application/zip", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "unknown zip" },
  { input: "application/x-msdownload", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "windows executable" },
  { input: "", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "empty content type" },
  { input: "garbage", expectedType: "application/octet-stream", expectedDisposition: "attachment", label: "garbage value" },
];

let passed = 0;
let failed = 0;

for (const c of TYPE_CASES) {
  try {
    const out = sanitizeServedContentType(c.input);
    assert.equal(out.contentType, c.expectedType, `contentType mismatch for ${c.label}`);
    assert.equal(out.disposition, c.expectedDisposition, `disposition mismatch for ${c.label}`);
    passed++;
  } catch (err) {
    failed++;
    console.error(`FAIL: ${c.label}`);
    console.error(`  input: ${JSON.stringify(c.input)}`);
    console.error(`  ${(err as Error).message}`);
  }
}

type FilenameCase = { input: string; matches: (out: string) => boolean; label: string };

const FILENAME_CASES: FilenameCase[] = [
  { input: "photo.jpg", matches: (o) => o === "photo.jpg", label: "simple name preserved" },
  { input: "../../etc/passwd", matches: (o) => o === "passwd", label: "path traversal stripped" },
  { input: "evil\".html", matches: (o) => !o.includes("\""), label: "double quote removed" },
  { input: "back\\slash.txt", matches: (o) => !o.includes("\\"), label: "backslash removed" },
  { input: "ctrl\x00\x01name.txt", matches: (o) => o === "ctrl__name.txt" && !/[\x00-\x1f]/.test(o), label: "control characters scrubbed" },
  { input: "", matches: (o) => o === "file", label: "empty fallback" },
  { input: "x".repeat(500), matches: (o) => o.length === 200, label: "length capped" },
];

for (const c of FILENAME_CASES) {
  try {
    const out = buildSafeFilename(c.input);
    assert.ok(c.matches(out), `unexpected filename ${JSON.stringify(out)} for ${c.label}`);
    passed++;
  } catch (err) {
    failed++;
    console.error(`FAIL: ${c.label}`);
    console.error(`  input: ${JSON.stringify(c.input)}`);
    console.error(`  ${(err as Error).message}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed (${TYPE_CASES.length + FILENAME_CASES.length} total).`);
process.exit(failed === 0 ? 0 : 1);
