import { Hono } from "hono";
import { scrapeLatestVersion } from "../lib/scraper.ts";
import { pushVersion } from "../lib/kv.ts";

const refresh = new Hono<{ Bindings: CloudflareBindings }>();

// POST /refresh
refresh.post("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || authHeader !== `Bearer ${c.env.REFRESH_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const entry = await scrapeLatestVersion();
  const isNew = await pushVersion(c.env.SQLITE_CACHE, entry, true);

  return c.json({ ok: true as const, version: entry.version, isNew });
});

export default refresh;
