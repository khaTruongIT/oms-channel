import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TenantsService } from '../tenants/tenants.service';

type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    await this.userRepository.save(user);

    // Auto-create default tenant for new user
    try {
      const defaultTenant = await this.tenantsService.createTenant(user.id, {
        shopName: `${email.split('@')[0]}'s Shop`,
        contactEmail: email,
        timezone: 'UTC',
        currency: 'USD',
        locale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
      });

      this.logger.log(
        `Default tenant created for user ${user.id}: ${defaultTenant.id}`,
      );
    } catch (error: unknown) {
      this.logger.error('Failed to create default tenant', error);
      // Don't fail registration if tenant creation fails
      // User can create tenant manually later
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Partial<User>;
  }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Remove password hash before returning
    const { passwordHash: omittedPasswordHash, ...result } = user;
    void omittedPasswordHash;
    return result;
  }

  async updateProfile(
    userId: string,
    data: Partial<User>,
  ): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Only allow updating specific fields
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone) user.phone = data.phone;
    if (data.timezone) user.timezone = data.timezone;
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;

    const savedUser = await this.userRepository.save(user);
    const { passwordHash: omittedPasswordHash, ...result } = savedUser;
    void omittedPasswordHash;
    return result;
  }

  // ==================== Refresh Token Management ====================

  async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = randomUUID();
    const tokenSecret = randomBytes(32).toString('base64url');
    const hashedTokenSecret = await bcrypt.hash(tokenSecret, 10);

    const refreshToken = this.refreshTokenRepository.create({
      id: tokenId,
      token: hashedTokenSecret,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      revoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return `${tokenId}.${tokenSecret}`;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    await this.cleanupExpiredTokens();

    const tokenParts = this.parseRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { id: tokenParts.id },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenSecretValid = await bcrypt.compare(
      tokenParts.secret,
      storedToken.token,
    );
    if (!isTokenSecretValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      await this.revokeAllUserTokens(storedToken.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (new Date() > storedToken.expiresAt) {
      storedToken.revoked = true;
      await this.refreshTokenRepository.save(storedToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    storedToken.revoked = true;
    await this.refreshTokenRepository.save(storedToken);

    const payload = { sub: storedToken.user.id, email: storedToken.user.email };
    const access_token = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    return { access_token, refresh_token: newRefreshToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenParts = this.tryParseRefreshToken(refreshToken);
    if (!tokenParts) {
      return;
    }

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { id: tokenParts.id },
    });
    if (!storedToken || storedToken.revoked) {
      return;
    }

    const isTokenSecretValid = await bcrypt.compare(
      tokenParts.secret,
      storedToken.token,
    );
    if (!isTokenSecretValid) {
      return;
    }

    storedToken.revoked = true;
    await this.refreshTokenRepository.save(storedToken);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  private async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private parseRefreshToken(refreshToken: string): {
    id: string;
    secret: string;
  } {
    const tokenParts = this.tryParseRefreshToken(refreshToken);
    if (!tokenParts) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokenParts;
  }

  private tryParseRefreshToken(
    refreshToken: string,
  ): { id: string; secret: string } | null {
    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [id, secret] = parts;
    if (!id || !secret) {
      return null;
    }

    return { id, secret };
  }
}
