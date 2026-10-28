import { spawnSync } from "child_process";

const testFiles = [
  "client/src/lib/suggestSlots.test.ts",
  "server/pushService.endpointAllowlist.test.ts",
  "server/objectStorage/objectStorage.sanitize.test.ts",
];

let failed = false;
console.log("Starting test suite execution...\n");

for (const file of testFiles) {
  console.log(`\n▶ Running: ${file}`);
  const result = spawnSync(`npx tsx -r dotenv/config "${file}"`, {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    failed = true;
    console.error(`✖ FAILED: ${file}`);
  }
}

if (failed) {
  console.error("\nSome test suites failed.");
  process.exit(1);
} else {
  console.log("\n✔ All test suites passed successfully!");
}
