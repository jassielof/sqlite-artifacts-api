export interface Artifact {
  product: string;
  url: string;
  sizeBytes: number;
  sha3: string;
}

export interface VersionEntry {
  version: string;
  fetchedAt: string;
  artifacts: Artifact[];
}

export interface VersionsListResponse {
  versions: string[];
  latest: string | null;
}

export interface RefreshResponse {
  ok: true;
  version: string;
  isNew: boolean;
}

export interface HealthResponse {
  ok: true;
  cachedVersions: number;
  latest: string | null;
}

export interface ErrorResponse {
  error: string;
}
