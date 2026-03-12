import type { Artifact, VersionEntry } from "../types.ts";

const BASE_URL = "https://www.sqlite.org/";
const DOWNLOAD_URL = BASE_URL + "download.html";

export async function scrapeLatestVersion(): Promise<VersionEntry> {
  const response = await fetch(DOWNLOAD_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch download page: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // The CSV comment starts with "Download product data for scripts to read"
  // followed by lines like: PRODUCT,VERSION,RELATIVE-URL,SIZE-IN-BYTES,SHA3-HASH
  const commentMatch = html.match(
    /<!--\s*Download product data for scripts to read\s*([\s\S]*?)-->/,
  );
  if (!commentMatch) {
    console.log(
      "Could not find CSV comment. First 500 chars of HTML:",
      html.slice(0, 500),
    );
    throw new Error("Could not find CSV comment in download page");
  }

  const commentBody = commentMatch[1];
  const lines = commentBody
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 && l.includes(",") && !l.startsWith("PRODUCT,VERSION"),
    );

  if (lines.length === 0) {
    throw new Error("No CSV data found in comment block");
  }

  let version: string | null = null;
  const artifacts: Artifact[] = [];

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 5) continue;

    const [_product, ver, relativeUrl, sizeStr, sha3] = parts;

    if (!version) {
      version = ver;
    }

    // Derive product name from filename, e.g.
    //   "2026/sqlite-tools-linux-x64-3520000.zip" → "sqlite-tools-linux-x64"
    const filename = relativeUrl.split("/").pop() ?? relativeUrl;
    const product = filename.replace(/[-_]\d{7,}\..*$/, "");

    artifacts.push({
      product,
      url: `${BASE_URL}${relativeUrl}`,
      sizeBytes: parseInt(sizeStr, 10),
      sha3,
    });
  }

  if (!version || artifacts.length === 0) {
    throw new Error("Failed to parse any artifacts from CSV data");
  }

  return {
    version,
    fetchedAt: new Date().toISOString(),
    artifacts,
  };
}
