import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { OmsClient } from "./oms.client";
import { OmsController } from "./oms.controller";

@Module({
  imports: [AuthModule],
  controllers: [OmsController],
  providers: [OmsClient, JwtAuthGuard, RolesGuard],
  exports: [OmsClient],
})
export class OmsModule {}
