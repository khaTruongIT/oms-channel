import { Module } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthModule } from "../auth/auth.module";
import { ArticlesController } from "./articles.controller";
import { ArticlesService } from "./articles.service";

@Module({
  imports: [AuthModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, JwtAuthGuard, RolesGuard],
})
export class ArticlesModule {}
