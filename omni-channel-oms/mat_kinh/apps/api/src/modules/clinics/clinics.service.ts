import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { clinics, filterClinics, type Clinic } from "@optiqis/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { ListClinicsDto } from "./dto/list-clinics.dto";
import type { CreateClinicDto, UpdateClinicDto } from "./dto/upsert-clinic.dto";

@Injectable()
export class ClinicsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: ListClinicsDto): Promise<Clinic[]> {
    if (!this.prisma.client) {
      return filterClinics(clinics, query);
    }

    const items = await this.prisma.client.clinic.findMany({
      orderBy: [{ province: "asc" }, { district: "asc" }],
    });

    return filterClinics(items, query);
  }

  async findById(id: string): Promise<Clinic> {
    if (!this.prisma.client) {
      const clinic = clinics.find((item) => item.id === id);
      if (!clinic) throw new NotFoundException("Clinic not found");
      return clinic;
    }

    const clinic = await this.prisma.client.clinic.findUnique({
      where: { id },
    });

    if (!clinic) throw new NotFoundException("Clinic not found");
    return clinic;
  }

  async create(dto: CreateClinicDto): Promise<Clinic> {
    const newClinic: Clinic = {
      id: `clinic-${Date.now()}`,
      ...dto,
    };

    if (!this.prisma.client) {
      clinics.unshift(newClinic);
      return newClinic;
    }

    const created = await this.prisma.client.clinic.create({
      data: newClinic,
    });

    return created;
  }

  async update(id: string, dto: UpdateClinicDto): Promise<Clinic> {
    if (!this.prisma.client) {
      const index = clinics.findIndex((c) => c.id === id);
      if (index < 0) throw new NotFoundException("Clinic not found");
      const updated = { ...clinics[index], ...dto } as Clinic;
      clinics[index] = updated;
      return updated;
    }

    await this.findById(id);

    const updated = await this.prisma.client.clinic.update({
      where: { id },
      data: dto,
    });

    return updated;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    if (!this.prisma.client) {
      const index = clinics.findIndex((c) => c.id === id);
      if (index < 0) throw new NotFoundException("Clinic not found");
      clinics.splice(index, 1);
      return { success: true };
    }

    await this.findById(id);

    await this.prisma.client.clinic.delete({ where: { id } });
    return { success: true };
  }
}
