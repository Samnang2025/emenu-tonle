import MenuPageClient from "@/components/MenuPageClient";
import { FALLBACK_TABLES } from "@/lib/tables";

export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return FALLBACK_TABLES.map((t) => ({
    projectName: "tonle-coffee.pos",
    tableNumber: t.id,
  }));
}

export default function TableMenuPage() {
  return <MenuPageClient />;
}
