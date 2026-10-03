"use server";

import { revalidatePath } from "next/cache";
import type { ConsultationLead, LeadStatus } from "@optiqis/shared";
import { updateLeadStatus } from "@/lib/api";

export async function updateLeadStatusAction(id: string, status: LeadStatus): Promise<ConsultationLead> {
  const updated = await updateLeadStatus(id, status);
  revalidatePath("/admin/leads");
  return updated;
}
