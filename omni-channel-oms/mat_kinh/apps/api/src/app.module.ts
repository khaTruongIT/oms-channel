import { Module } from "@nestjs/common";
import { ArticlesModule } from "./modules/articles/articles.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ClinicsModule } from "./modules/clinics/clinics.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { OmsModule } from "./modules/oms/oms.module";
import { ProductsModule } from "./modules/products/products.module";
import { SeoModule } from "./modules/seo/seo.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuthModule, OmsModule, ProductsModule, ArticlesModule, ClinicsModule, LeadsModule, SeoModule],
})
export class AppModule {}
