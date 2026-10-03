import type { ConsultationLead } from "@optiqis/shared";
import { LeadsTable } from "@/components/admin/leads-table";
import { AdminShell } from "@/components/brand/admin-shell";
import { getAdminLeads } from "@/lib/api";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminLeadsPage() {
  const user = await getAdminUser();
  let leads: ConsultationLead[] = [];
  let error: string | null = null;

  try {
    leads = await getAdminLeads();
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught.message : "Không thể tải danh sách lead.";
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
        <LeadsTable leads={leads} />
      )}
    </AdminShell>
  );
}
