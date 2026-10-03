import { Body, Controller, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { scoreSeo, type SeoResult } from "@optiqis/shared";
import { ApiErrorResponseDto, SeoResultResponseDto } from "../../common/api-docs.dto";
import { strictDtoPipe } from "../../common/pipes";
import { SeoScoreDto } from "./dto/seo-score.dto";

@ApiTags("seo")
@Controller("seo")
export class SeoController {
  @Post("score")
  @ApiOperation({ summary: "Score article SEO fields with deterministic OPTIQIS guardrails" })
  @ApiCreatedResponse({ type: SeoResultResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  score(@Body(strictDtoPipe(SeoScoreDto)) dto: SeoScoreDto): SeoResult {
    return scoreSeo(dto);
  }
}
