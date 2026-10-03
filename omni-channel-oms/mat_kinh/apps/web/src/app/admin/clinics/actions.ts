"use server";

import { revalidatePath } from "next/cache";
import type { Clinic } from "@optiqis/shared";
import { createClinic, deleteClinic, updateClinic } from "@/lib/api";

export async function createClinicAction(clinic: Omit<Clinic, "id">): Promise<Clinic> {
  const created = await createClinic(clinic);
  revalidatePath("/admin/clinics");
  revalidatePath("/tim-diem-ban");
  return created;
}

export async function updateClinicAction(id: string, clinic: Partial<Clinic>): Promise<Clinic> {
  const updated = await updateClinic(id, clinic);
  revalidatePath("/admin/clinics");
  revalidatePath(`/admin/clinics/${id}/edit`);
  revalidatePath("/tim-diem-ban");
  return updated;
}

export async function deleteClinicAction(id: string): Promise<{ success: boolean }> {
  const result = await deleteClinic(id);
  revalidatePath("/admin/clinics");
  revalidatePath("/tim-diem-ban");
  return result;
}
