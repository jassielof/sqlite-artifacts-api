import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { openApiSpec } from "./lib/openapi.ts";
import { scrapeLatestVersion } from "./lib/scraper.ts";
import { pushVersion } from "./lib/kv.ts";
import versions from "./routes/versions.ts";
import refresh from "./routes/refresh.ts";
import health from "./routes/health.ts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// API routes
const api = new Hono<{ Bindings: CloudflareBindings }>();
api.route("/versions", versions);
api.route("/refresh", refresh);
api.route("/health", health);
app.route("/api", api);

// Redirect root to docs
app.get("/", (c) => c.redirect("/docs", 301));

// OpenAPI spec
app.get("/openapi.json", (c) => c.json(openApiSpec));

// Scalar docs UI
app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "SQLite Artifacts API",
  }),
);

// Cron trigger handler
async function handleScheduled(env: CloudflareBindings): Promise<void> {
  const entry = await scrapeLatestVersion();
  await pushVersion(env.SQLITE_CACHE, entry);
}

export default {
  fetch: app.fetch.bind(app),
  scheduled(
    _event: ScheduledEvent,
    env: CloudflareBindings,
    ctx: ExecutionContext,
  ): void {
    ctx.waitUntil(handleScheduled(env));
  },
};
