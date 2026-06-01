import { getSessionUser } from "@/lib/session";
import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Search, Users } from "lucide-react";
import { formatNum } from "@/lib/utils";
import { AddCustomerButton } from "./add-customer-button";
import { CustomersTable } from "./customers-table";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; lifecycle?: string; page?: string }> }) {
  const user = await getSessionUser();
  const sp = await searchParams;
  const q = sp.q?.trim();
  const lifecycle = sp.lifecycle;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const take = 25;
  const skip = (page - 1) * take;

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (lifecycle) query.set("lifecycle", lifecycle);
  // exportQuery = filters only (no paging) so "Export all" pulls every match.
  const exportQuery = query.toString();
  query.set("page", String(page));
  query.set("take", String(take));

  const data = await serverApi<{ customers: any[]; total: number; pages: number }>(`/customers?${query.toString()}`);
  const customers = data.customers;
  const total = data.total;
  const pages = data.pages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${formatNum(total)} unified profiles across your brands`}
        actions={<AddCustomerButton brands={user.brands} />}
      />

      <form className="flex flex-wrap items-center gap-2" action="">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search" name="q" defaultValue={q}
            placeholder="Search by name, email, phone, ID…"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <select name="lifecycle" defaultValue={lifecycle ?? ""} className="h-9 rounded-lg border border-border bg-surface px-3 text-sm">
          <option value="">All lifecycles</option>
          {["NEW", "ACTIVE", "VIP", "AT_RISK", "CHURNED"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
      </form>

      {customers.length === 0 ? (
        <Empty icon={<Users />} title="No customers found" description="Adjust your filters or add a new customer." />
      ) : (
        <CustomersTable
          customers={customers}
          total={total}
          page={page}
          pages={pages}
          skip={skip}
          take={take}
          exportQuery={exportQuery}
          params={{ ...(q ? { q } : {}), ...(lifecycle ? { lifecycle } : {}) }}
        />
      )}
    </div>
  );
}
