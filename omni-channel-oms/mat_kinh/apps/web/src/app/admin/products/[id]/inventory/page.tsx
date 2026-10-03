import { notFound } from "next/navigation";
import { ProductInventoryPanel } from "@/components/admin/product-inventory-panel";
import { AdminShell } from "@/components/brand/admin-shell";
import {
  getAdminProduct,
  getProductInventory,
  getWarehouses,
  type AdminInventoryItem,
  type AdminWarehouse,
} from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminProductInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUser();
  const product = await getAdminProduct(id);

  if (!product) {
    notFound();
  }

  let inventory: AdminInventoryItem[] = [];
  let warehouses: AdminWarehouse[] = [];
  try {
    [inventory, warehouses] = await Promise.all([getProductInventory(id), getWarehouses()]);
  } catch {
    inventory = [];
    warehouses = [];
  }

  return (
    <AdminShell user={user}>
      <ProductInventoryPanel inventory={inventory} product={product} warehouses={warehouses} />
    </AdminShell>
  );
}
