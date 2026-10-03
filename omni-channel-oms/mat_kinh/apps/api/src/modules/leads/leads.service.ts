import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ConsultationLead, LeadStatus } from "@optiqis/shared";
import { consultationLeadFromDb } from "../../common/mappers";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateLeadDto } from "./dto/create-lead.dto";
import type { ListLeadsDto } from "./dto/list-leads.dto";

const memoryLeads: ConsultationLead[] = [];

export interface LeadSubmissionResponse {
  id: string;
  status: LeadStatus;
  createdAt: string;
}

@Injectable()
export class LeadsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto): Promise<LeadSubmissionResponse> {
    const now = new Date().toISOString();
    const payload = normalizeLeadInput(dto);

    if (!this.prisma.client) {
      const lead: ConsultationLead = {
        id: `lead-${randomUUID()}`,
        ...payload,
        status: "NEW",
        createdAt: now,
        updatedAt: now,
      };
      memoryLeads.unshift(lead);
      return toSubmissionResponse(lead);
    }

    const created = await this.prisma.client.consultationLead.create({
      data: {
        ...payload,
        status: "NEW",
      },
    });

    return toSubmissionResponse(consultationLeadFromDb(created));
  }

  async findAll(query: ListLeadsDto): Promise<ConsultationLead[]> {
    if (!this.prisma.client) {
      return filterLeads(memoryLeads, query);
    }

    const leads = await this.prisma.client.consultationLead.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.query
          ? {
              OR: [
                { fullName: { contains: query.query, mode: "insensitive" } },
                { phone: { contains: query.query } },
                { email: { contains: query.query, mode: "insensitive" } },
                { productName: { contains: query.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return leads.map(consultationLeadFromDb);
  }

  async updateStatus(id: string, status: LeadStatus): Promise<ConsultationLead> {
    if (!this.prisma.client) {
      const index = memoryLeads.findIndex((lead) => lead.id === id);
      if (index < 0) throw new NotFoundException("Lead not found");
      const current = memoryLeads[index];
      if (!current) throw new NotFoundException("Lead not found");
      const updated: ConsultationLead = {
        ...current,
        status,
        updatedAt: new Date().toISOString(),
      };
      memoryLeads[index] = updated;
      return updated;
    }

    await this.findById(id);
    const updated = await this.prisma.client.consultationLead.update({
      where: { id },
      data: { status },
    });

    return consultationLeadFromDb(updated);
  }

  private async findById(id: string): Promise<ConsultationLead> {
    if (!this.prisma.client) {
      const lead = memoryLeads.find((item) => item.id === id);
      if (!lead) throw new NotFoundException("Lead not found");
      return lead;
    }

    const lead = await this.prisma.client.consultationLead.findUnique({
      where: { id },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return consultationLeadFromDb(lead);
  }
}

function normalizeLeadInput(dto: CreateLeadDto): Omit<ConsultationLead, "id" | "status" | "createdAt" | "updatedAt"> {
  return {
    fullName: dto.fullName.trim(),
    phone: dto.phone.replace(/[\s.-]/g, ""),
    email: normalizeOptionalString(dto.email),
    province: normalizeOptionalString(dto.province),
    district: normalizeOptionalString(dto.district),
    productId: normalizeOptionalString(dto.productId),
    productName: normalizeOptionalString(dto.productName),
    clinicId: normalizeOptionalString(dto.clinicId),
    preferredTime: normalizeOptionalString(dto.preferredTime),
    note: normalizeOptionalString(dto.note),
    source: dto.source,
  };
}

function normalizeOptionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toSubmissionResponse(lead: ConsultationLead): LeadSubmissionResponse {
  return {
    id: lead.id,
    status: lead.status,
    createdAt: lead.createdAt,
  };
}

function filterLeads(leads: ConsultationLead[], query: ListLeadsDto): ConsultationLead[] {
  const normalizedQuery = query.query?.trim().toLowerCase();
  return leads.filter((lead) => {
    const matchesStatus = !query.status || lead.status === query.status;
    const haystack = [lead.fullName, lead.phone, lead.email, lead.productName]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });
}
