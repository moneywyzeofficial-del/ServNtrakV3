// Focused tests for the SSRF allowlist used by push subscription handling.
// No test framework is wired into this project, so this file is a
// self-contained assertion script. Run with:
//
//   npx tsx server/pushService.endpointAllowlist.test.ts
//
// Exits with code 0 when every case passes, code 1 otherwise. Intended
// as a quick smoke check after changes to isAllowedPushEndpoint.

import assert from "node:assert/strict";
import { isAllowedPushEndpoint } from "./pushService";

type Case = { endpoint: unknown; expected: boolean; label: string };

const CASES: Case[] = [
  // ── Legitimate browser push services ──────────────────────────────
  { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", expected: true, label: "FCM exact host" },
  { endpoint: "https://android.googleapis.com/send/abc", expected: true, label: "FCM legacy host" },
  { endpoint: "https://updates.push.services.mozilla.com/wpush/v2/abc", expected: true, label: "Mozilla Autopush root" },
  { endpoint: "https://random-node-42.push.services.mozilla.com/wpush/v2/abc", expected: true, label: "Mozilla Autopush sharded node" },
  { endpoint: "https://web.push.apple.com/QABC123XYZ", expected: true, label: "Apple Web Push exact host" },
  { endpoint: "https://api-push-east.push.apple.com/3/device/abc", expected: true, label: "Apple APNs sharded node (suffix)" },
  { endpoint: "https://something.notify.windows.com/x", expected: true, label: "Microsoft WNS (suffix)" },

  // ── Wrong protocol ────────────────────────────────────────────────
  { endpoint: "http://fcm.googleapis.com/fcm/send/abc", expected: false, label: "http:// rejected" },
  { endpoint: "ftp://fcm.googleapis.com/fcm/send/abc", expected: false, label: "ftp:// rejected" },
  { endpoint: "ws://fcm.googleapis.com/fcm/send/abc", expected: false, label: "ws:// rejected" },
  { endpoint: "file:///etc/passwd", expected: false, label: "file:// rejected" },

  // ── Hosts not on the allowlist ────────────────────────────────────
  { endpoint: "https://attacker.example/probe", expected: false, label: "arbitrary attacker host rejected" },
  { endpoint: "https://169.254.169.254/latest/meta-data/", expected: false, label: "AWS metadata IP rejected" },
  { endpoint: "https://localhost/admin", expected: false, label: "localhost rejected" },
  { endpoint: "https://127.0.0.1/admin", expected: false, label: "loopback IP rejected" },
  { endpoint: "https://10.0.0.5/internal", expected: false, label: "RFC1918 IP rejected" },

  // ── Bypass attempts ───────────────────────────────────────────────
  { endpoint: "https://fcm.googleapis.com:8080/fcm/send/abc", expected: false, label: "non-default port rejected" },
  { endpoint: "https://user:pass@fcm.googleapis.com/fcm/send/abc", expected: false, label: "credential-smuggling rejected" },
  { endpoint: "https://fcm.googleapis.com/fcm/send/abc#frag", expected: false, label: "fragment rejected" },
  { endpoint: "https://evil.com.fcm.googleapis.com.evil.com/x", expected: false, label: "suffix-spoofing rejected (host ends in evil.com)" },
  { endpoint: "https://notfcm.googleapis.com/x", expected: false, label: "prefix-spoofing rejected" },
  { endpoint: "https://push.services.mozilla.com.attacker.example/x", expected: false, label: "trailing-host bypass rejected" },
  { endpoint: "https://push.apple.com/x", expected: false, label: "bare suffix anchor rejected (no leading subdomain)" },

  // ── Type / shape edge cases ───────────────────────────────────────
  { endpoint: "not-a-url", expected: false, label: "non-URL string rejected" },
  { endpoint: "", expected: false, label: "empty string rejected" },
  { endpoint: null, expected: false, label: "null rejected" },
  { endpoint: undefined, expected: false, label: "undefined rejected" },
  { endpoint: 12345, expected: false, label: "number rejected" },
  { endpoint: { endpoint: "https://fcm.googleapis.com/x" }, expected: false, label: "object rejected" },
  { endpoint: "https://" + "a".repeat(2050) + ".fcm.googleapis.com/x", expected: false, label: "endpoint > 2048 chars rejected" },
];

let passed = 0;
let failed = 0;
for (const c of CASES) {
  const got = isAllowedPushEndpoint(c.endpoint);
  try {
    assert.equal(got, c.expected);
    passed++;
    console.log(`  pass  ${c.label}`);
  } catch {
    failed++;
    console.error(`  FAIL  ${c.label}  (expected=${c.expected} got=${got})`);
  }
}

console.log(`\n${passed}/${passed + failed} cases passed`);
if (failed > 0) {
  process.exit(1);
}
