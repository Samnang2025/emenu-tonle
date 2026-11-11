"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import Loading from "@/components/core/loading";
import { getTables, peekCachedTables, prefetchMenuResources } from "@/lib/api";
import { FALLBACK_TABLES, TableItem, mapRawTables } from "@/lib/tables";

export default function TableSelectionClient() {
  const { projectName } = useParams();
  const project = Array.isArray(projectName) ? projectName[0] : projectName;
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [searchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("All");

  // Fetch tables dynamically from API (with instant SWR cache on back navigation)
  useEffect(() => {
    if (!project) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cached = peekCachedTables();
    if (cached?.data && Array.isArray(cached.data)) {
      setTables(mapRawTables(cached.data));
      setLoading(false);
    }

    const loadTables = async () => {
      try {
        const rawTables = await getTables({ forceRefresh: true });
        if (cancelled) return;
        if (Array.isArray(rawTables) && rawTables.length > 0) {
          setTables(mapRawTables(rawTables));
        } else if (!cached?.data) {
          console.warn("Tables API returned invalid data, using static fallback.");
          setTables(FALLBACK_TABLES);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Could not load tables, falling back to defaults.", err);
        if (!cached?.data) {
          setTables(FALLBACK_TABLES);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Warm menu API data & target route chunk while user picks a table
          prefetchMenuResources();
          router.prefetch(`/${project}/${FALLBACK_TABLES[0].id}`);
        }
      }
    };

    loadTables();
    return () => {
      cancelled = true;
    };
  }, [project, router]);

  // List of unique zones + "All" for filtering
  const zones = useMemo(() => {
    const uniqueZones = Array.from(new Set(tables.map((tbl) => tbl.zone)));
    return ["All", ...uniqueZones];
  }, [tables]);

  // Filter tables based on search query and selected zone
  const filteredTables = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();
    return tables.filter((table) => {
      const matchesSearch = table.name.toLowerCase().includes(normalizedQuery);
      const matchesZone = selectedZone === "All" || table.zone === selectedZone;
      return matchesSearch && matchesZone;
    });
  }, [searchQuery, selectedZone, tables]);

  const handlePrefetchTable = useCallback(
    (tableId: string) => {
      if (!project) return;
      router.prefetch(`/${project}/${tableId}`);
      prefetchMenuResources();
    },
    [project, router]
  );

  if (loading) {
    return (
      <Loading className="h-screen fixed w-full z-100 bg-white top-0 flex justify-center items-center left-0" />
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center px-4 py-6 font-battambong">
      {/* Premium Header Branding */}
      <div className="w-full max-w-[575px] flex flex-col items-center text-center mt-4 mb-8">
        <p className="text-lg text-red-500 mt-2 max-w-[80%]">
          {t("selectTableSubtitle")}
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[575px] flex-1 flex flex-col gap-4">
        {/* Zone Navigation / Filtering Tabs */}
        <div className="w-full overflow-x-auto no-scrollbar py-2">
          <ul className="flex flex-nowrap gap-2">
            {zones.map((zone) => {
              const displayZone =
                zone === "All" ? t("allZones") : zone === "VIP / Special" ? t("vipZone") : zone;
              const isActive = selectedZone === zone;
              return (
                <li key={zone}>
                  <button
                    onClick={() => setSelectedZone(zone)}
                    className={`text-nowrap px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-200 ${
                      isActive
                        ? "bg-orange-600 border-orange-600 text-white shadow-md transform -translate-y-[1px]"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {displayZone}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tables Grid Layout */}
        <div className="flex-1 mt-2">
          {filteredTables.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filteredTables.map((table) => {
                const isOccupied = table.active === "1";
                const href = `/${project}/${table.id}`;
                return (
                  <Link
                    key={table.id}
                    href={href}
                    prefetch={false}
                    onMouseEnter={() => handlePrefetchTable(table.id)}
                    onTouchStart={() => handlePrefetchTable(table.id)}
                    className={`group relative flex flex-col justify-center items-center py-6 px-3 border rounded-2xl transition-all duration-300 hover:scale-[1.04] active:scale-[0.97] shadow-sm ${
                      isOccupied
                        ? "bg-red-300 border-rose-200/80 hover:border-rose-400 text-white hover:shadow-[0_8px_20px_rgba(239,68,68,0.1)]"
                        : "bg-sky-50 hover:bg-sky-100/70 border-sky-200/80 hover:border-sky-400 text-sky-950 hover:shadow-[0_8px_20px_rgba(14,165,233,0.1)]"
                    }`}
                  >
                    {/* Status Pill Badge */}
                    <span
                      className={`absolute top-2 right-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isOccupied
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-sky-500 text-white"
                      }`}
                    >
                      {isOccupied ? t("occupied") : t("available")}
                    </span>

                    {/* Table Icon (Dining table with chairs) */}
                    <svg
                      viewBox="0 0 64 64"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-12 h-12 mb-2 transition-transform duration-300 group-hover:scale-105 ${
                        isOccupied ? "text-red-600" : "text-sky-600"
                      }`}
                    >
                      {/* Left Chair */}
                      <path d="M12 20h6v18h-6z M12 28h6" />
                      <path d="M15 38v8" />

                      {/* Right Chair */}
                      <path d="M46 20h6v18h-6z M46 28h6" />
                      <path d="M49 38v8" />

                      {/* Table Top & legs */}
                      <path d="M22 26h20v4H22z" />
                      <path d="M25 30v16 M39 30v16" />
                    </svg>

                    {/* Table name */}
                    <span
                      className={`text-xl font-black font-dangrek transition-colors duration-200 ${
                        isOccupied
                          ? "text-red-950 group-hover:text-red-600"
                          : "text-sky-950 group-hover:text-sky-600"
                      }`}
                    >
                      {table.name}
                    </span>

                    {/* Zone description */}
                    <span
                      className={`text-[10px] mt-0.5 font-medium tracking-wide ${
                        isOccupied ? "text-red-600/60" : "text-sky-600/60"
                      }`}
                    >
                      {table.zone === "VIP / Special" ? t("vipZone") : table.zone}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-gray-300 mb-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.5a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
                />
              </svg>
              <span className="text-gray-400 text-sm font-medium">
                No tables match your search.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

