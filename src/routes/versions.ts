import { Hono } from "hono";
import { getIndex, getVersion, pushVersion } from "../lib/kv.ts";
import { scrapeLatestVersion } from "../lib/scraper.ts";

const versions = new Hono<{ Bindings: CloudflareBindings }>();

async function ensureSeeded(kv: KVNamespace): Promise<string[]> {
  let index = await getIndex(kv);
  if (index.length === 0) {
    const entry = await scrapeLatestVersion();
    await pushVersion(kv, entry);
    index = await getIndex(kv);
  }
  return index;
}

// GET /versions
versions.get("/", async (c) => {
  const index = await ensureSeeded(c.env.SQLITE_CACHE);
  return c.json({
    versions: index,
    latest: index.length > 0 ? index[index.length - 1] : null,
  });
});

// GET /versions/latest
versions.get("/latest", async (c) => {
  const index = await ensureSeeded(c.env.SQLITE_CACHE);
  const latest = index[index.length - 1];
  const entry = await getVersion(c.env.SQLITE_CACHE, latest);
  if (!entry) {
    return c.json({ error: "Version data missing" }, 500);
  }
  return c.json(entry);
});

// GET /versions/:version
versions.get("/:version", async (c) => {
  const version = c.req.param("version");
  let entry = await getVersion(c.env.SQLITE_CACHE, version);

  if (!entry) {
    // Try scraping — if the requested version is the current release, cache and return it
    const scraped = await scrapeLatestVersion();
    await pushVersion(c.env.SQLITE_CACHE, scraped);
    if (scraped.version === version) {
      entry = scraped;
    }
  }

  if (!entry) {
    return c.json(
      {
        error: `Version ${version} not found. Only the current sqlite.org release can be fetched on demand. Use GET /api/versions to see cached versions.`,
      },
      404,
    );
  }
  return c.json(entry);
});

export default versions;
