import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { AuthResponse, User } from "@optiqis/shared";
import { ApiErrorResponseDto, AuthResponseDto, UserResponseDto } from "../../common/api-docs.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { strictDtoPipe } from "../../common/pipes";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password for CMS access" })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  login(@Body(strictDtoPipe(LoginDto)) dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("demo-bearer")
  @ApiOperation({ summary: "Get list of available demo users (ADMIN only)" })
  @ApiOkResponse({ type: [UserResponseDto] })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  listUsers(): User[] {
    return this.authService.getDemoUsers();
  }
}
