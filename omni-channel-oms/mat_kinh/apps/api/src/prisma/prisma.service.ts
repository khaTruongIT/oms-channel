import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient | null =
    process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
      ? new PrismaClient()
      : null;

  async onModuleInit(): Promise<void> {
    await this.client?.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}
