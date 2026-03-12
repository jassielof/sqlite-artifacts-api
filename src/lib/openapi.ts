export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "SQLite Artifacts API",
    description:
      "API for tracking SQLite release artifacts scraped from the official download page.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/versions": {
      get: {
        summary: "List cached versions",
        operationId: "listVersions",
        tags: ["Versions"],
        responses: {
          "200": {
            description: "List of all cached version strings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionsListResponse" },
              },
            },
          },
        },
      },
    },
    "/api/versions/latest": {
      get: {
        summary: "Get latest version details",
        operationId: "getLatestVersion",
        tags: ["Versions"],
        responses: {
          "200": {
            description: "Full artifact data for the latest cached version",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionEntry" },
              },
            },
          },
          "404": {
            description: "No versions cached yet",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/versions/{version}": {
      get: {
        summary: "Get a specific version's details",
        operationId: "getVersion",
        tags: ["Versions"],
        parameters: [
          {
            name: "version",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "3.46.0",
          },
        ],
        responses: {
          "200": {
            description: "Full artifact data for the requested version",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VersionEntry" },
              },
            },
          },
          "404": {
            description: "Version not found in cache",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/refresh": {
      post: {
        summary: "Trigger a scrape and cache update",
        operationId: "refresh",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Refresh result",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshResponse" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Health check",
        operationId: "health",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service health status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http" as const,
        scheme: "bearer",
      },
    },
    schemas: {
      Artifact: {
        type: "object" as const,
        required: ["product", "url", "sizeBytes", "sha3"],
        properties: {
          product: { type: "string", example: "sqlite-amalgamation-3460000" },
          url: {
            type: "string",
            format: "uri",
            example:
              "https://www.sqlite.org/2024/sqlite-amalgamation-3460000.zip",
          },
          sizeBytes: { type: "integer", example: 2690265 },
          sha3: {
            type: "string",
            example:
              "142d0a38a63ee7b844c5667b886ef5b29e1e9fdfd17811e2fc4fd6a0cbe15d59",
          },
        },
      },
      VersionEntry: {
        type: "object" as const,
        required: ["version", "fetchedAt", "artifacts"],
        properties: {
          version: { type: "string", example: "3.46.0" },
          fetchedAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-15T00:00:00.000Z",
          },
          artifacts: {
            type: "array",
            items: { $ref: "#/components/schemas/Artifact" },
          },
        },
      },
      VersionsListResponse: {
        type: "object" as const,
        required: ["versions", "latest"],
        properties: {
          versions: {
            type: "array",
            items: { type: "string" },
            example: ["3.45.0", "3.46.0"],
          },
          latest: {
            type: ["string", "null"],
            example: "3.46.0",
          },
        },
      },
      RefreshResponse: {
        type: "object" as const,
        required: ["ok", "version", "isNew"],
        properties: {
          ok: { type: "boolean", example: true },
          version: { type: "string", example: "3.46.0" },
          isNew: { type: "boolean", example: true },
        },
      },
      HealthResponse: {
        type: "object" as const,
        required: ["ok", "cachedVersions", "latest"],
        properties: {
          ok: { type: "boolean", example: true },
          cachedVersions: { type: "integer", example: 3 },
          latest: {
            type: ["string", "null"],
            example: "3.46.0",
          },
        },
      },
      ErrorResponse: {
        type: "object" as const,
        required: ["error"],
        properties: {
          error: {
            type: "string",
            example: "Version 3.44.0 not found in cache",
          },
        },
      },
    },
  },
};
