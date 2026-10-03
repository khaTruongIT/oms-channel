import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminProduct } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, user] = await Promise.all([getAdminProduct(id), getAdminUser()]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell user={user}>
      <ProductEditor product={product} />
    </AdminShell>
  );
}

