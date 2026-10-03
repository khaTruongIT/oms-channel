import type { Product } from "@optiqis/shared";
import { OmsStatusBanner } from "@/components/admin/oms-status-banner";
import { ProductsTable } from "@/components/admin/products-table";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminProducts, getOmsStatus, type OmsStatus } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminProductsPage() {
  const user = await getAdminUser();
  let products: Product[] = [];
  let omsStatus: OmsStatus | null = null;
  let error: string | null = null;

  try {
    [products, omsStatus] = await Promise.all([getAdminProducts(), getOmsStatus()]);
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught.message : "Không thể tải danh sách dòng kính.";
    try {
      omsStatus = await getOmsStatus();
    } catch {
      omsStatus = null;
    }
  }

  return (
    <AdminShell user={user}>
      <OmsStatusBanner status={omsStatus} />
      {error ? (
        <div className="p-5 lg:p-8">
          <div className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        </div>
      ) : (
        <ProductsTable products={products} user={user} />
      )}
    </AdminShell>
  );
}
