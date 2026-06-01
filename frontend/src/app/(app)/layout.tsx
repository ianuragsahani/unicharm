import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { BrandProvider } from "@/lib/brand-context";
import { ToastProvider } from "@/components/ui/toast";
import { activeBrandSelection, type SessionUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as unknown as SessionUser;
  const brands = user.brands ?? [];
  const activeBrandId = await activeBrandSelection(user);

  return (
    <BrandProvider brands={brands} initialActiveId={activeBrandId}>
      <ToastProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white focus:shadow-pop">
          Skip to main content
        </a>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <Topbar />
            <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </BrandProvider>
  );
}
