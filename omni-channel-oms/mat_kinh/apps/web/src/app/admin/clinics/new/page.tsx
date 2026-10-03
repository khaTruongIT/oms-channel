import { ClinicEditor } from "@/components/admin/clinic-editor";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminNewClinicPage() {
  const user = await getAdminUser();

  return (
    <AdminShell user={user}>
      <ClinicEditor />
    </AdminShell>
  );
}
