"use server";

import { createConsultationLead, type CreateLeadInput, type LeadSubmissionResponse } from "@/lib/api";

export async function submitConsultationLeadAction(input: CreateLeadInput): Promise<LeadSubmissionResponse> {
  return createConsultationLead(input);
}
