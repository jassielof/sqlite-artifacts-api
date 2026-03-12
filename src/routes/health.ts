import { Hono } from "hono";
import { getIndex } from "../lib/kv.ts";

const health = new Hono<{ Bindings: CloudflareBindings }>();

// GET /health
health.get("/", async (c) => {
  const index = await getIndex(c.env.SQLITE_CACHE);
  return c.json({
    ok: true as const,
    cachedVersions: index.length,
    latest: index.length > 0 ? index[index.length - 1] : null,
  });
});

export default health;
