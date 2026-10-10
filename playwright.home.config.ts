import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/e2e", testMatch: "home-atmosphere.spec.ts", workers: 1, timeout: 60000, use: { baseURL: process.env.DISCOVERY_BASE_URL || "http://127.0.0.1:59320", browserName: "chromium" } });
