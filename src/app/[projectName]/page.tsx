import TableSelectionClient from "@/components/TableSelectionClient";

export const revalidate = 3600;

export function generateStaticParams() {
  return [{ projectName: "tonle-coffee.pos" }];
}

export default function TableSelectionPage() {
  return <TableSelectionClient />;
}
