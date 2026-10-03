import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { users, type AuthResponse, type User } from "@optiqis/shared";
import type { LoginDto } from "./dto/login.dto";

export interface JwtPayload {
  sub: string;
  email: string;
  role: User["role"];
}

/** Demo password — all users share this single password for the prototype */
const DEMO_PASSWORD = "optiqis2026";

@Injectable()
export class AuthService {
  private readonly memoryUsers: User[] = users as User[];

  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = this.memoryUsers.find(
      (u) => u.email.toLowerCase() === dto.email.toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException(
        "Invalid credentials. Please check your email or password.",
      );
    }

    if (dto.password !== DEMO_PASSWORD) {
      throw new UnauthorizedException(
        "Invalid credentials. Please check your email or password.",
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);

    return { user, token };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = this.memoryUsers.find((u) => u.id === payload.sub);
      if (!user) throw new UnauthorizedException("User no longer exists");
      return user;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  getDemoUsers(): User[] {
    return this.memoryUsers;
  }
}
