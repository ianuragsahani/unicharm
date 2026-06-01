"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { LifecycleBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Download } from "lucide-react";
import { formatINR, formatNum, relativeTime } from "@/lib/utils";

type Customer = {
  id: string; name: string; email: string | null; city: string | null;
  lifecycle: string; totalOrders: number; cltv: number; lastOrderAt: string | null;
  brand: { name: string; color: string };
};

const CSV_HEADERS = ["Name", "Email", "Brand", "Lifecycle", "City", "Orders", "CLTV", "Last order"];

function toCsvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function customersToCsv(rows: Customer[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const c of rows) {
    lines.push([
      c.name, c.email ?? "", c.brand.name, c.lifecycle, c.city ?? "",
      c.totalOrders, c.cltv, c.lastOrderAt ?? "",
    ].map(toCsvCell).join(","));
  }
  return lines.join("\n");
}

function download(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CustomersTable({
  customers, total, page, pages, skip, take, exportQuery, params,
}: {
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
  skip: number;
  take: number;
  exportQuery: string;
  params: Record<string, string | undefined>;
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const pageIds = useMemo(() => customers.map((c) => c.id), [customers]);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function exportSelected() {
    const rows = customers.filter((c) => selected.has(c.id));
    download(customersToCsv(rows), `customers-selected-${rows.length}.csv`);
    toast({ variant: "success", title: "Exported", description: `${rows.length} selected customer(s)` });
  }

  async function exportAll() {
    setExporting(true);
    try {
      // Pull every matching row (current filters), not just the visible page.
      const r = await fetch(`/api/customers?${exportQuery}&page=1&take=10000`);
      if (!r.ok) throw new Error(await r.text());
      const data = (await r.json()) as { customers: Customer[] };
      download(customersToCsv(data.customers), `customers-all-${data.customers.length}.csv`);
      toast({ variant: "success", title: "Exported", description: `${data.customers.length} customer(s)` });
    } catch (e) {
      toast({ variant: "error", title: "Export failed", description: (e as Error).message });
    } finally {
      setExporting(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm text-muted">
          {selectedCount > 0 ? `${selectedCount} selected` : `${formatNum(total)} customers`}
        </p>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button size="sm" onClick={exportSelected}>
              <Download size={14} /> Export {selectedCount} selected
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportAll} disabled={exporting}>
            <Download size={14} /> {exporting ? "Exporting…" : "Export all"}
          </Button>
        </div>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th className="w-10">
              <input
                type="checkbox"
                aria-label="Select all on page"
                checked={allOnPageSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border accent-brand-600"
              />
            </Th>
            <Th>Customer</Th>
            <Th>Brand</Th>
            <Th>Lifecycle</Th>
            <Th>City</Th>
            <Th className="text-right">Orders</Th>
            <Th className="text-right">CLTV</Th>
            <Th>Last order</Th>
          </Tr>
        </Thead>
        <Tbody>
          {customers.map((c) => (
            <Tr key={c.id} className={selected.has(c.id) ? "bg-brand-500/5" : undefined}>
              <Td>
                <input
                  type="checkbox"
                  aria-label={`Select ${c.name}`}
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 rounded border-border accent-brand-600"
                />
              </Td>
              <Td>
                <Link href={`/customers/${c.id}`} className="flex items-center gap-3 hover:text-brand-700">
                  <Avatar name={c.name} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted truncate">{c.email}</p>
                  </div>
                </Link>
              </Td>
              <Td>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${c.brand.color}1a`, color: c.brand.color }}>{c.brand.name}</span>
              </Td>
              <Td><LifecycleBadge value={c.lifecycle} /></Td>
              <Td className="text-sm">{c.city ?? "—"}</Td>
              <Td className="text-right tabular-nums">{c.totalOrders}</Td>
              <Td className="text-right font-medium tabular-nums">{formatINR(c.cltv)}</Td>
              <Td className="text-xs text-muted">{relativeTime(c.lastOrderAt)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs">
        <p className="text-muted">Showing {skip + 1}–{Math.min(skip + take, total)} of {formatNum(total)}</p>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={{ query: { ...params, page: page - 1 } }} className="rounded-md border border-border px-2 py-1 hover:bg-zinc-50">Prev</Link>
          ) : (
            <span aria-disabled="true" className="rounded-md border border-border px-2 py-1 text-muted opacity-50">Prev</span>
          )}
          <span>Page {page} of {pages}</span>
          {page < pages ? (
            <Link href={{ query: { ...params, page: page + 1 } }} className="rounded-md border border-border px-2 py-1 hover:bg-zinc-50">Next</Link>
          ) : (
            <span aria-disabled="true" className="rounded-md border border-border px-2 py-1 text-muted opacity-50">Next</span>
          )}
        </div>
      </div>
    </Card>
  );
}
