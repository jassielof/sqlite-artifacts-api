import type { VersionEntry } from "../types.ts";

const INDEX_KEY = "versions:index";

function versionKey(version: string): string {
  return `versions:${version}`;
}

export async function getIndex(kv: KVNamespace): Promise<string[]> {
  const raw = await kv.get(INDEX_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

export async function getVersion(
  kv: KVNamespace,
  version: string,
): Promise<VersionEntry | null> {
  const raw = await kv.get(versionKey(version));
  if (!raw) return null;
  return JSON.parse(raw) as VersionEntry;
}

export async function pushVersion(
  kv: KVNamespace,
  entry: VersionEntry,
  force = false,
): Promise<boolean> {
  const index = await getIndex(kv);
  const existed = index.includes(entry.version);

  if (existed && !force) return false;

  if (!existed) {
    index.push(entry.version);
    await kv.put(INDEX_KEY, JSON.stringify(index));
  }

  await kv.put(versionKey(entry.version), JSON.stringify(entry));
  return !existed;
}
