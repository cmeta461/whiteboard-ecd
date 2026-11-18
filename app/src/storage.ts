import { get, set, del } from "idb-keyval";
import { nanoid } from "nanoid";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export interface DrawingMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface DrawingData {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
}

export interface Settings {
  theme: "light" | "dark";
  lastOpenId?: string;
  sidebarOpen: boolean;
}

const META_KEY = "meta";
const SETTINGS_KEY = "settings";
const drawingKey = (id: string) => `drawing:${id}`;

const DEFAULT_SETTINGS: Settings = { theme: "light", sidebarOpen: true };

/** appState fields worth persisting (never `collaborators` — it's a Map). */
const PERSISTED_APP_STATE_KEYS = [
  "viewBackgroundColor",
  "gridSize",
  "scrollX",
  "scrollY",
  "zoom",
  "currentItemStrokeColor",
  "currentItemBackgroundColor",
  "currentItemFontFamily",
  "currentItemRoughness",
  "currentItemStrokeWidth",
] as const satisfies readonly (keyof AppState)[];

export function pickAppState(appState: Partial<AppState>): Partial<AppState> {
  const out: Record<string, unknown> = {};
  for (const key of PERSISTED_APP_STATE_KEYS) {
    if (appState[key] !== undefined) out[key] = appState[key];
  }
  return out as Partial<AppState>;
}

// Serialize every read-modify-write of the meta list so concurrent
// saves/renames can't overwrite each other.
let metaQueue: Promise<unknown> = Promise.resolve();
function updateMeta(fn: (meta: DrawingMeta[]) => DrawingMeta[]): Promise<DrawingMeta[]> {
  const run = async () => {
    const meta = ((await get<DrawingMeta[]>(META_KEY)) ?? []).slice();
    const next = fn(meta);
    await set(META_KEY, next);
    return next;
  };
  const result = metaQueue.then(run, run);
  metaQueue = result.catch(() => undefined);
  return result;
}

const sortMeta = (meta: DrawingMeta[]) => meta.slice().sort((a, b) => b.updatedAt - a.updatedAt);

export async function listDrawings(): Promise<DrawingMeta[]> {
  try {
    await metaQueue;
    return sortMeta((await get<DrawingMeta[]>(META_KEY)) ?? []);
  } catch (err) {
    console.error("listDrawings failed", err);
    return [];
  }
}

export async function createDrawing(name = "Untitled", data?: DrawingData): Promise<DrawingMeta> {
  const now = Date.now();
  const drawing: DrawingMeta = { id: nanoid(10), name, createdAt: now, updatedAt: now };
  try {
    await set(drawingKey(drawing.id), data ?? { elements: [], appState: {}, files: {} });
    await updateMeta((meta) => [...meta, drawing]);
  } catch (err) {
    console.error("createDrawing failed", err);
  }
  return drawing;
}

export async function loadDrawing(id: string): Promise<DrawingData | null> {
  try {
    return (await get<DrawingData>(drawingKey(id))) ?? null;
  } catch (err) {
    console.error("loadDrawing failed", err);
    return null;
  }
}

export async function saveDrawing(id: string, data: DrawingData): Promise<DrawingMeta[] | null> {
  try {
    const clean: DrawingData = {
      elements: data.elements.filter((e) => !e.isDeleted),
      appState: pickAppState(data.appState),
      files: data.files,
    };
    await set(drawingKey(id), clean);
    const meta = await updateMeta((meta) =>
      meta.map((m) => (m.id === id ? { ...m, updatedAt: Date.now() } : m)),
    );
    return sortMeta(meta);
  } catch (err) {
    console.error("saveDrawing failed", err);
    return null;
  }
}

export async function renameDrawing(id: string, name: string): Promise<DrawingMeta[]> {
  try {
    return sortMeta(await updateMeta((meta) => meta.map((m) => (m.id === id ? { ...m, name } : m))));
  } catch (err) {
    console.error("renameDrawing failed", err);
    return listDrawings();
  }
}

export async function deleteDrawing(id: string): Promise<DrawingMeta[]> {
  try {
    await del(drawingKey(id));
    return sortMeta(await updateMeta((meta) => meta.filter((m) => m.id !== id)));
  } catch (err) {
    console.error("deleteDrawing failed", err);
    return listDrawings();
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    return { ...DEFAULT_SETTINGS, ...((await get<Settings>(SETTINGS_KEY)) ?? {}) };
  } catch (err) {
    console.error("getSettings failed", err);
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  try {
    const current = await getSettings();
    await set(SETTINGS_KEY, { ...current, ...patch });
  } catch (err) {
    console.error("setSettings failed", err);
  }
}
