import { ProductEditor } from "@/components/admin/product-editor";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminNewProductPage() {
  const user = await getAdminUser();

  return (
    <AdminShell user={user}>
      <ProductEditor />
    </AdminShell>
  );
}

