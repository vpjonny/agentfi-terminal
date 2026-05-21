/**
 * Hourly snapshot history store, JSON-file backed.
 *
 * Designed for hourly cadence at small N (168 entries/week per agent).
 * Atomic writes via tmp-file + rename. Single file at `data/snapshots.json`.
 *
 * Hot-path reads use an mtime-keyed in-memory cache (process-local) so
 * repeated reads within the same process don't re-parse the file.
 *
 * KNOWN CONSTRAINTS (deferred to v1.1):
 *   - Whole-file read per cold call. Fine to ~10k entries; degrades past 50k.
 *     Migrate to Postgres when entry count exceeds 10k or read latency > 50ms.
 *   - Single-writer assumption. There's no file lock — if you ever run
 *     `pnpm snapshot` manually WHILE the hourly cron fires, two writers race
 *     and ONE write loses (atomic rename means no corruption, but the loser
 *     is silently dropped). Production cron is the only writer; keep it that
 *     way until the Postgres swap.
 *
 * Swap-out path: replace the read/write internals with a Postgres pool while
 * keeping the same exported surface (HistoryEntry, recordSnapshot, getHistory,
 * getLatest). No consumer changes required.
 */

import { readFile, writeFile, rename, mkdir, stat } from "node:fs/promises";
import path from "node:path";

export interface HistoryEntry {
  /** Unix ms */
  ts: number;
  slug: string;
  multiple: number;
  mcapUsd: number;
  stakedDiem: number;
}

interface StoreFile {
  version: 1;
  entries: HistoryEntry[];
}

/* ─── Path resolution ──────────────────────────────────────────────────── */

function dataDir(): string {
  return process.env.SNAPSHOT_DATA_DIR ?? path.join(process.cwd(), "data");
}

function storePath(): string {
  return path.join(dataDir(), "snapshots.json");
}

/* ─── IO ────────────────────────────────────────────────────────────────── */

async function ensureDir(): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
}

/**
 * Process-local cache keyed by mtime. Skips file read + JSON parse if the
 * file hasn't changed since last hit. Saves ~3-5ms per hot-path read.
 * Invalidated automatically by `writeStore` (bumps mtime).
 */
let cachedStore: { mtimeMs: number; path: string; store: StoreFile } | null = null;

async function readStore(): Promise<StoreFile> {
  const target = storePath();
  try {
    const st = await stat(target);
    if (
      cachedStore &&
      cachedStore.path === target &&
      cachedStore.mtimeMs === st.mtimeMs
    ) {
      return cachedStore.store;
    }
    const buf = await readFile(target, "utf-8");
    const parsed = JSON.parse(buf) as StoreFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }
    cachedStore = { mtimeMs: st.mtimeMs, path: target, store: parsed };
    return parsed;
  } catch (err) {
    // ENOENT or parse error → empty store
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, entries: [] };
    }
    return { version: 1, entries: [] };
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  await ensureDir();
  const target = storePath();
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await rename(tmp, target);
  // Invalidate cache — next read will pick up the new mtime.
  cachedStore = null;
}

/* ─── Public API ────────────────────────────────────────────────────────── */

/** Append a snapshot. Idempotent if `ts` matches an existing entry exactly. */
export async function recordSnapshot(entry: HistoryEntry): Promise<void> {
  const store = await readStore();
  const dup = store.entries.find((e) => e.slug === entry.slug && e.ts === entry.ts);
  if (dup) return;
  store.entries.push(entry);
  // Keep file size bounded: drop entries older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  store.entries = store.entries.filter((e) => e.ts >= cutoff);
  store.entries.sort((a, b) => a.ts - b.ts);
  await writeStore(store);
}

/** All entries for `slug` newer than `sinceMs` (default: all). Sorted ascending. */
export async function getHistory(slug: string, sinceMs = 0): Promise<HistoryEntry[]> {
  const store = await readStore();
  return store.entries.filter((e) => e.slug === slug && e.ts >= sinceMs);
}

/** Most-recent entry for `slug`, or null. */
export async function getLatest(slug: string): Promise<HistoryEntry | null> {
  const hist = await getHistory(slug);
  return hist.length === 0 ? null : hist[hist.length - 1];
}

/** Total entry count (testing aid). */
export async function _countEntries(): Promise<number> {
  const store = await readStore();
  return store.entries.length;
}

/** Wipe (testing aid). */
export async function _wipe(): Promise<void> {
  await writeStore({ version: 1, entries: [] });
}

/** Where the store file lives (testing aid). */
export function _storePath(): string {
  return storePath();
}
