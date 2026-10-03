import type { Clinic } from "@optiqis/shared";
import { ClinicsTable } from "@/components/admin/clinics-table";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminClinics } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminClinicsPage() {
  const user = await getAdminUser();
  let clinics: Clinic[] = [];
  let error: string | null = null;

  try {
    clinics = await getAdminClinics();
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught.message : "Không thể tải danh sách phòng khám.";
  }

  return (
    <AdminShell user={user}>
      {error ? (
        <div className="p-5 lg:p-8">
          <div className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        </div>
      ) : (
        <ClinicsTable clinics={clinics} user={user} />
      )}
    </AdminShell>
  );
}
