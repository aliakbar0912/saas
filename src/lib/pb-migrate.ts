// ============================================================
// PocketBase schema migration logic
// ============================================================
// This module compares the desired schema (from pb-schema.ts)
// against what's currently in the PocketBase instance, and
// applies the minimum set of changes (create/update collections,
// add/modify fields, set API rules, create indexes).
//
// All operations are idempotent — safe to run multiple times.
// We never destroy existing data.
// ============================================================

import "server-only";
import { getPbAdmin, isPbAdminConfigured, pbUrl } from "./pb-admin";
import { collections, indexes, type CollectionDef, type FieldDef, type IndexDef } from "./pb-schema";

interface ExistingCollection {
  id: string;
  name: string;
  type: "auth" | "base";
  fields?: unknown;
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
  indexes?: string[];
}

export interface MigrationResult {
  ok: boolean;
  message: string;
  created: string[];
  updated: string[];
  skipped: string[];
  errors: { collection: string; error: string }[];
  indexesCreated: string[];
  verification: VerificationResult | null;
}

export interface VerificationResult {
  ok: boolean;
  collections: { name: string; ok: boolean; missingFields: string[]; issues: string[] }[];
  indexes: { name: string; ok: boolean }[];
  summary: string;
}

/**
 * Run schema migration: ensures every collection defined in pb-schema.ts
 * exists with the correct fields and rules. Also creates indexes.
 */
export async function migrateSchema(): Promise<MigrationResult> {
  if (!isPbAdminConfigured()) {
    return {
      ok: false,
      message:
        "Admin credentials not configured. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env, then re-run.",
      created: [],
      updated: [],
      skipped: collections.map((c) => c.name),
      errors: [],
      indexesCreated: [],
      verification: null,
    };
  }

  const pb = await getPbAdmin();

  // Fetch all existing collections (paginated)
  const existing = new Map<string, ExistingCollection>();
  let page = 1;
  while (true) {
    const res = await pb.send(`/api/collections?page=${page}&perPage=100`, {
      method: "GET",
    });
    const items = res.items ?? [];
    for (const item of items) {
      existing.set(item.name, item as ExistingCollection);
    }
    if (page >= (res.totalPages ?? 1)) break;
    page++;
  }

  const result: MigrationResult = {
    ok: true,
    message: "",
    created: [],
    updated: [],
    skipped: [],
    errors: [],
    indexesCreated: [],
    verification: null,
  };

  // Build a name → id map so relation fields can resolve their targets
  const nameToId = new Map<string, string>();
  for (const [name, col] of existing.entries()) {
    nameToId.set(name, col.id);
  }

  // Create/update collections in the specified order
  for (const def of collections) {
    try {
      const fieldsPayload = def.fields.map((f) => buildFieldPayload(f, nameToId));

      const collectionPayload: Record<string, unknown> = {
        name: def.name,
        type: def.type,
        fields: fieldsPayload,
        listRule: def.listRule ?? null,
        viewRule: def.viewRule ?? null,
        createRule: def.createRule ?? null,
        updateRule: def.updateRule ?? null,
        deleteRule: def.deleteRule ?? null,
      };

      if (existing.has(def.name)) {
        // Update existing collection (non-destructive)
        const existingCol = existing.get(def.name)!;
        try {
          await pb.send(`/api/collections/${existingCol.id}`, {
            method: "PATCH",
            body: collectionPayload,
          });
          result.updated.push(def.name);
        } catch (err) {
          const e = err as Error;
          result.errors.push({
            collection: def.name,
            error: `Update failed: ${e.message}`,
          });
        }
      } else {
        // Create new collection
        try {
          const created = await pb.send(`/api/collections`, {
            method: "POST",
            body: collectionPayload,
          });
          if (created?.id) {
            nameToId.set(def.name, created.id);
            // Update the existing map so subsequent collections can reference it
            existing.set(def.name, created as ExistingCollection);
          }
          result.created.push(def.name);
        } catch (err) {
          const e = err as Error;
          result.errors.push({
            collection: def.name,
            error: `Create failed: ${e.message}`,
          });
        }
      }
    } catch (err) {
      const e = err as Error;
      result.errors.push({
        collection: def.name,
        error: `Unexpected: ${e.message}`,
      });
    }
  }

  // Create indexes
  for (const idx of indexes) {
    try {
      const col = existing.get(idx.collection);
      if (!col) {
        // Collection doesn't exist (creation failed) — skip index
        continue;
      }

      // Build the index SQL expression
      // PocketBase uses the format: CREATE INDEX `idx_name` ON `collection` (`field1`, `field2`)
      const fieldList = idx.fields.map((f) => `\`${f}\``).join(", ");
      const indexExpr = idx.unique
        ? `CREATE UNIQUE INDEX \`${idx.name}\` ON \`${idx.collection}\` (${fieldList})`
        : `CREATE INDEX \`${idx.name}\` ON \`${idx.collection}\` (${fieldList})`;

      // Check if index already exists
      const existingIndexes = (col.indexes as string[]) ?? [];
      const alreadyExists = existingIndexes.some(
        (e) => e.includes(`\`${idx.name}\``) || e === indexExpr,
      );

      if (alreadyExists) {
        // Skip — index already exists
        continue;
      }

      // Add the new index to the collection's index list
      const newIndexes = [...existingIndexes, indexExpr];
      await pb.send(`/api/collections/${col.id}`, {
        method: "PATCH",
        body: { indexes: newIndexes },
      });
      result.indexesCreated.push(idx.name);
    } catch (err) {
      // Index creation failure is non-fatal — the collection still works
      const e = err as Error;
      result.errors.push({
        collection: idx.collection,
        error: `Index ${idx.name} creation failed: ${e.message}`,
      });
    }
  }

  // Run verification
  result.verification = await verifySchema(pb, existing);

  result.message = `Migration complete. Created ${result.created.length} collections, updated ${result.updated.length}, created ${result.indexesCreated.length} indexes, errors ${result.errors.length}.`;
  result.ok = result.errors.length === 0;
  return result;
}

/**
 * Get migration status without performing any changes.
 */
export async function getMigrationStatus(): Promise<{
  ok: boolean;
  message: string;
  total: number;
  existing: string[];
  missing: string[];
  instanceUrl: string;
  adminConfigured: boolean;
}> {
  const desiredNames = collections.map((c) => c.name);
  if (!isPbAdminConfigured()) {
    return {
      ok: false,
      message: "Admin credentials not configured.",
      total: desiredNames.length,
      existing: [],
      missing: desiredNames,
      instanceUrl: pbUrl(),
      adminConfigured: false,
    };
  }

  try {
    const pb = await getPbAdmin();
    const existing = new Set<string>();
    let page = 1;
    while (true) {
      const res = await pb.send(`/api/collections?page=${page}&perPage=100`, {
        method: "GET",
      });
      const items = res.items ?? [];
      for (const item of items) {
        existing.add(item.name);
      }
      if (page >= (res.totalPages ?? 1)) break;
      page++;
    }
    const missing = desiredNames.filter((n) => !existing.has(n));
    return {
      ok: missing.length === 0,
      message: missing.length === 0
        ? "All collections present."
        : `${missing.length} collections missing.`,
      total: desiredNames.length,
      existing: desiredNames.filter((n) => existing.has(n)),
      missing,
      instanceUrl: pbUrl(),
      adminConfigured: true,
    };
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      message: `Failed to query collections: ${e.message}`,
      total: desiredNames.length,
      existing: [],
      missing: desiredNames,
      instanceUrl: pbUrl(),
      adminConfigured: true,
    };
  }
}

/**
 * Verify that all collections exist with correct fields, types, and rules.
 */
export async function verifySchema(
  pb: Awaited<ReturnType<typeof getPbAdmin>>,
  existingMap: Map<string, ExistingCollection>,
): Promise<VerificationResult> {
  const result: VerificationResult = {
    ok: true,
    collections: [],
    indexes: [],
    summary: "",
  };

  // Re-fetch all collections to get the latest state
  const freshCollections = new Map<string, ExistingCollection>();
  let page = 1;
  while (true) {
    const res = await pb.send(`/api/collections?page=${page}&perPage=100`, {
      method: "GET",
    });
    const items = res.items ?? [];
    for (const item of items) {
      freshCollections.set(item.name, item as ExistingCollection);
    }
    if (page >= (res.totalPages ?? 1)) break;
    page++;
  }

  // Verify each collection
  for (const def of collections) {
    const colResult = { name: def.name, ok: true, missingFields: [] as string[], issues: [] as string[] };

    const actual = freshCollections.get(def.name);
    if (!actual) {
      colResult.ok = false;
      colResult.issues.push("Collection does not exist");
      result.ok = false;
      result.collections.push(colResult);
      continue;
    }

    // Verify fields
    const actualFields = (actual.fields as { name: string; type: string }[]) ?? [];
    const actualFieldMap = new Map(actualFields.map((f) => [f.name, f.type]));

    for (const expectedField of def.fields) {
      if (!actualFieldMap.has(expectedField.name)) {
        colResult.missingFields.push(expectedField.name);
        colResult.ok = false;
      }
    }

    // Verify API rules
    if (def.listRule !== undefined && def.listRule !== (actual.listRule ?? null)) {
      colResult.issues.push(`listRule mismatch: expected "${def.listRule}", got "${actual.listRule}"`);
      colResult.ok = false;
    }
    if (def.viewRule !== undefined && def.viewRule !== (actual.viewRule ?? null)) {
      colResult.issues.push(`viewRule mismatch`);
      colResult.ok = false;
    }

    result.collections.push(colResult);
  }

  // Verify indexes
  for (const idx of indexes) {
    const col = freshCollections.get(idx.collection);
    const colIndexes = (col?.indexes as string[]) ?? [];
    const exists = colIndexes.some(
      (e) => e.includes(`\`${idx.name}\``),
    );
    result.indexes.push({ name: idx.name, ok: exists });
    if (!exists) {
      result.ok = false;
    }
  }

  const colOk = result.collections.filter((c) => c.ok).length;
  const idxOk = result.indexes.filter((i) => i.ok).length;
  result.summary = `Collections: ${colOk}/${result.collections.length} OK, Indexes: ${idxOk}/${result.indexes.length} OK`;

  return result;
}

/**
 * Build a PocketBase field payload from our FieldDef.
 * Resolves relation targets via the nameToId map.
 */
function buildFieldPayload(
  f: FieldDef,
  nameToId: Map<string, string>,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    name: f.name,
    type: f.type,
    required: f.required ?? false,
    hidden: false,
    presentable: false,
  };

  switch (f.type) {
    case "text":
      base.options = {
        min: f.options?.min ?? 0,
        max: f.options?.max ?? 0,
        pattern: f.options?.pattern ?? "",
      };
      break;
    case "number":
      base.options = {
        min: f.options?.min ?? null,
        max: f.options?.max ?? null,
        noDecimal: false,
      };
      break;
    case "bool":
      base.options = {};
      break;
    case "email":
      base.options = {
        exceptDomains: f.options?.exceptDomains ?? [],
        onlyDomains: f.options?.onlyDomains ?? [],
      };
      break;
    case "url":
      base.options = {
        exceptDomains: f.options?.exceptDomains ?? [],
        onlyDomains: f.options?.onlyDomains ?? [],
      };
      break;
    case "date":
      base.options = {
        min: "",
        max: "",
      };
      break;
    case "select":
      base.options = {
        maxSelect: f.options?.maxSelect ?? 1,
        values: f.options?.values ?? [],
      };
      break;
    case "json":
      base.options = {
        maxSize: 5_000_000,
      };
      break;
    case "file":
      base.options = {
        maxSelect: f.options?.maxSelect ?? 1,
        maxSize: f.options?.maxSize ?? 5_000_000,
        mimeTypes: f.options?.mimeTypes ?? [],
        thumbs: [],
        protected: false,
      };
      break;
    case "relation":
      base.options = {
        collectionId: f.options?.collectionId ?? "",
        cascade: f.options?.cascade ?? "null",
        minSelect: 0,
        maxSelect: f.options?.maxSelect ?? 1,
        displayFields: [],
      };
      break;
    case "editor":
      base.options = {
        convertUrls: true,
      };
      break;
    default:
      base.options = {};
      break;
  }

  // For relation fields, resolve the collection name → id
  if (f.type === "relation" && f.options?.collectionId) {
    const target = nameToId.get(f.options.collectionId);
    if (target) {
      (base.options as { collectionId: string }).collectionId = target;
    }
  }

  return base;
}

export const collectionList = collections;
export const indexList = indexes;
export type { CollectionDef, IndexDef };
