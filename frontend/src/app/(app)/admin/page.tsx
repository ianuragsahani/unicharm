import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/motion/fade-in";
import { Users, Building2, ScrollText, ShieldCheck } from "lucide-react";

const TILES = [
  { href: "/admin/users", title: "Users & roles", description: "Manage CRM access, RBAC, brand assignment", Icon: Users },
  { href: "/admin/brands", title: "Brands", description: "View and configure Unicharm brand ecosystems", Icon: Building2 },
  { href: "/admin/audit", title: "Audit log", description: "Immutable trail of all CRM actions", Icon: ScrollText },
  { href: "/admin/consent", title: "Consent governance", description: "Communication preferences and DPDP compliance", Icon: ShieldCheck },
] as const;

export default function AdminIndex() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin & Governance" description="Users, brands, audit, consent" />
      <Stagger className="grid gap-4 md:grid-cols-2">
        {TILES.map((t) => (
          <StaggerItem key={t.href}>
            <Link href={t.href}>
              <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <div className="p-6">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <t.Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold group-hover:text-brand-700">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted">{t.description}</p>
                </div>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
