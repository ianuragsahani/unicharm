import { serverApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { InviteUserButton } from "./invite-user-button";

const ROLE_VARIANT: Record<string, "info" | "success" | "warning" | "default"> = {
  SUPER_ADMIN: "info", BRAND_ADMIN: "info", MARKETER: "success", ANALYST: "default", AGENT: "warning",
};

export default async function UsersAdminPage() {
  const [{ users }, { brands }] = await Promise.all([
    serverApi<{ users: any[] }>("/admin/users"),
    serverApi<{ brands: any[] }>("/admin/brands"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles" description={`${users.length} users`} actions={<InviteUserButton brands={brands} />} />
      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Brands</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size={32} />
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge></Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.brandAccess.length === 0 ? <span className="text-xs text-muted">—</span> : u.brandAccess.map((ba: any) => (
                      <span key={ba.id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${ba.brand.color}1a`, color: ba.brand.color }}>{ba.brand.name}</span>
                    ))}
                  </div>
                </Td>
                <Td><Badge variant={u.active ? "success" : "default"}>{u.active ? "Active" : "Disabled"}</Badge></Td>
                <Td className="text-xs text-muted">{formatDate(u.createdAt)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
