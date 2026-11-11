import type { MenuType, orderHistoryType } from "@/types/model";

export const API_BASE_URL = "https://tonle-coffee.pos.tsdsolution.net";
export const DRIVER_API_URL = `${API_BASE_URL}/api/DriverController`;
export const IMG_BASE_URL = `${API_BASE_URL}/assets/uploads/`;
export const LOGO_BASE_URL = `${API_BASE_URL}/assets/uploads/logos/`;

export interface StoreSetting {
  logo?: string;
  site_name?: string;
  slide_Show?: string;
  symbol?: string;
  language?: string;
}

export interface TableItemRaw {
  id: string;
  name: string;
  floor_id?: string;
  active?: string;
}

export interface OrderConfig {
  googlemap?: string;
  telegram?: string;
  tiktok?: string;
  phone_num?: string;
  hero?: string;
  icon?: unknown;
}

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const CACHE_PREFIX = "tonle_emenu_v1:";
const SETTING_KEY = `${CACHE_PREFIX}setting`;
const TABLES_KEY = `${CACHE_PREFIX}tables`;
const MENU_KEY = `${CACHE_PREFIX}menu`;

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

function readCache<T>(key: string, maxAgeMs: number): CacheEntry<T> | null {
  const now = Date.now();
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem) {
    if (now - mem.ts <= maxAgeMs) return mem;
    memoryCache.delete(key);
  }

  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.ts !== "number" || now - parsed.ts > maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): CacheEntry<T> {
  const entry: CacheEntry<T> = { data, ts: Date.now() };
  memoryCache.set(key, entry);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore storage quota or private-mode errors
    }
  }
  return entry;
}

export function clearCacheKey(key: string) {
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 15000, ...fetchInit } = init || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    const text = await res.text();
    if (!text) {
      return null as T;
    }
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

function dedupe<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = loader().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}

export function peekCachedSetting(maxAgeMs = 5 * 60 * 1000): CacheEntry<StoreSetting> | null {
  return readCache<StoreSetting>(SETTING_KEY, maxAgeMs);
}

export async function getSetting(options?: { forceRefresh?: boolean }): Promise<StoreSetting | null> {
  if (!options?.forceRefresh) {
    const cached = peekCachedSetting(5 * 60 * 1000);
    if (cached) return cached.data;
  }
  return dedupe("setting", async () => {
    const data = await fetchJson<StoreSetting>(`${DRIVER_API_URL}/setting`);
    if (data) writeCache(SETTING_KEY, data);
    return data;
  });
}

export function peekCachedTables(maxAgeMs = 2 * 60 * 1000): CacheEntry<TableItemRaw[]> | null {
  return readCache<TableItemRaw[]>(TABLES_KEY, maxAgeMs);
}

export async function getTables(options?: { forceRefresh?: boolean }): Promise<TableItemRaw[]> {
  if (!options?.forceRefresh) {
    const cached = peekCachedTables(60 * 1000);
    if (cached) return cached.data;
  }
  return dedupe("tables", async () => {
    const data = await fetchJson<TableItemRaw[]>(`${DRIVER_API_URL}/tables`);
    if (Array.isArray(data)) {
      writeCache(TABLES_KEY, data);
      return data;
    }
    return [];
  });
}

export function invalidateTablesCache() {
  clearCacheKey(TABLES_KEY);
}

export function peekCachedMenuData(maxAgeMs = 5 * 60 * 1000): CacheEntry<MenuType> | null {
  return readCache<MenuType>(MENU_KEY, maxAgeMs);
}

export async function getMenuData(options?: { forceRefresh?: boolean }): Promise<MenuType> {
  if (!options?.forceRefresh) {
    const cached = peekCachedMenuData(5 * 60 * 1000);
    if (cached) return cached.data;
  }
  return dedupe("menu", async () => {
    const data = await fetchJson<MenuType>(
      `${DRIVER_API_URL}/GetAllProductWithCat?t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (Array.isArray(data)) {
      writeCache(MENU_KEY, data);
      return data;
    }
    return [];
  });
}

export async function getOrderConfig(): Promise<OrderConfig | null> {
  const cacheKey = `${CACHE_PREFIX}orderConfig`;
  const cached = readCache<OrderConfig>(cacheKey, 10 * 60 * 1000);
  if (cached) return cached.data;
  return dedupe("orderConfig", async () => {
    const data = await fetchJson<OrderConfig>(`${DRIVER_API_URL}/e_orderConfig`);
    if (data) writeCache(cacheKey, data);
    return data;
  });
}

export async function getTableOrders(tableNumber: string): Promise<orderHistoryType | null> {
  const formData = new FormData();
  formData.append("table_num", `${tableNumber}`);
  return fetchJson<orderHistoryType | null>(`${DRIVER_API_URL}/orders`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
}

export async function submitOrder(payload: unknown): Promise<unknown> {
  return fetchJson<unknown>(`${DRIVER_API_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function parseSlideShow(slideShow?: string): Array<{ name: string }> {
  if (!slideShow) return [];
  try {
    const corrected = slideShow.replace(/,\s*]$/, "]");
    const parsed = JSON.parse(corrected);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function prefetchMenuResources() {
  if (typeof window === "undefined") return;
  void getSetting().catch(() => {});
  void getMenuData().catch(() => {});
}

