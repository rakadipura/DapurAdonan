import { getCustomerFacingSettings } from "@/lib/settings";
import { SiteHeader } from "@/components/customer/layout/SiteHeader";
import { SiteFooter } from "@/components/customer/layout/SiteFooter";

export const dynamic = "force-dynamic";

/**
 * Single template for every customer-facing page.
 * The top navigation and footer are defined HERE and only here,
 * so they cannot drift between pages. URLs are unchanged:
 * the (site) segment is a route group and never appears in paths.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCustomerFacingSettings();

  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf0]">
      <SiteHeader storeName={settings.storeName} logoUrl={settings.logoUrl} />
      <div className="flex-1">{children}</div>
      <SiteFooter storeName={settings.storeName} wide />
    </div>
  );
}
