import { notFound } from "next/navigation";
import { ClinicEditor } from "@/components/admin/clinic-editor";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminClinic } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminEditClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [clinic, user] = await Promise.all([getAdminClinic(id), getAdminUser()]);

  if (!clinic) {
    notFound();
  }

  return (
    <AdminShell user={user}>
      <ClinicEditor clinic={clinic} />
    </AdminShell>
  );
}
