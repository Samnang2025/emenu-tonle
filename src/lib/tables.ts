import type { TableItemRaw } from "@/lib/api";

export interface TableItem {
  id: string;
  name: string;
  zone: string;
  active?: string;
}

// Fallback tables mapped with IDs, Names and Zones
export const FALLBACK_TABLES: TableItem[] = [
  { id: "3", name: "A1", zone: "Zone A", active: "0" },
  { id: "4", name: "A2", zone: "Zone A", active: "0" },
  { id: "5", name: "A3", zone: "Zone A", active: "0" },
  { id: "6", name: "A4", zone: "Zone A", active: "0" },
  { id: "7", name: "A5", zone: "Zone A", active: "0" },
  { id: "8", name: "A6", zone: "Zone A", active: "0" },
  { id: "38", name: "A7", zone: "Zone A", active: "0" },
  { id: "10", name: "A8", zone: "Zone A", active: "0" },
  { id: "11", name: "A9", zone: "Zone A", active: "0" },
  { id: "41", name: "A10", zone: "Zone A", active: "0" },
  { id: "34", name: "A11", zone: "Zone A", active: "0" },
  { id: "14", name: "A12", zone: "Zone A", active: "0" },
  { id: "35", name: "A13", zone: "Zone A", active: "0" },
  { id: "16", name: "A14", zone: "Zone A", active: "0" },
  { id: "17", name: "B1", zone: "Zone B", active: "0" },
  { id: "18", name: "B2", zone: "Zone B", active: "0" },
  { id: "40", name: "B3", zone: "Zone B", active: "0" },
  { id: "42", name: "B4", zone: "Zone B", active: "0" },
  { id: "20", name: "B5", zone: "Zone B", active: "0" },
  { id: "21", name: "B6", zone: "Zone B", active: "0" },
  { id: "22", name: "B7", zone: "Zone B", active: "0" },
  { id: "23", name: "C1", zone: "Zone C", active: "0" },
  { id: "24", name: "C2", zone: "Zone C", active: "0" },
  { id: "25", name: "C3", zone: "Zone C", active: "0" },
  { id: "26", name: "C4", zone: "Zone C", active: "0" },
  { id: "28", name: "C5", zone: "Zone C", active: "0" },
  { id: "29", name: "C6", zone: "Zone C", active: "0" },
  { id: "30", name: "C7", zone: "Zone C", active: "0" },
  { id: "31", name: "C8", zone: "Zone C", active: "0" },
  { id: "32", name: "K1", zone: "Zone K", active: "0" },
  { id: "43", name: "VIP", zone: "VIP / Special", active: "0" },
  { id: "44", name: "KTV", zone: "VIP / Special", active: "0" },
  { id: "45", name: "Boat", zone: "VIP / Special", active: "0" },
];

export function mapRawTables(rawTables: TableItemRaw[]): TableItem[] {
  return rawTables.map((t) => {
    let zone = "Other Zone";
    if (t.floor_id === "1") zone = "Zone A";
    else if (t.floor_id === "2") zone = "Zone B";
    else if (t.floor_id === "3") zone = "Zone C";
    else if (t.floor_id === "4") zone = "Zone K";
    else if (t.floor_id === "5") zone = "VIP / Special";
    else {
      const upperName = t.name.toUpperCase();
      if (upperName.startsWith("A")) zone = "Zone A";
      else if (upperName.startsWith("B")) zone = "Zone B";
      else if (upperName.startsWith("C")) zone = "Zone C";
      else if (upperName.startsWith("K")) zone = "Zone K";
      else if (["VIP", "KTV", "BOAT"].includes(upperName)) zone = "VIP / Special";
    }
    return {
      id: t.id,
      name: t.name,
      zone,
      active: t.active,
    };
  });
}

