import { defineConfig } from "@playwright/test";
// Point to a freshly built production server with a populated, isolated fixture DB.
export default defineConfig({ testDir: "./tests/e2e", testMatch: "discovery.spec.ts", workers: 1, use: { baseURL: process.env.DISCOVERY_BASE_URL || "http://127.0.0.1:59319", browserName: "chromium" } });
