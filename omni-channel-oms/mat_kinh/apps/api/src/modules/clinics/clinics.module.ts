import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthModule } from "../auth/auth.module";
import { ClinicsController } from "./clinics.controller";
import { ClinicsService } from "./clinics.service";

@Module({
  imports: [AuthModule],
  controllers: [ClinicsController],
  providers: [ClinicsService, JwtAuthGuard, RolesGuard],
})
export class ClinicsModule {}
