import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

@Injectable()
export class CredentialCipherService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const key = this.getKey();
    const payload = Buffer.from(ciphertext, 'base64');
    const minimumPayloadSize = IV_BYTES + AUTH_TAG_BYTES + 1;

    if (payload.length < minimumPayloadSize) {
      throw new InternalServerErrorException(
        'Stored channel credentials are invalid',
      );
    }

    const iv = payload.subarray(0, IV_BYTES);
    const authTag = payload.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const encrypted = payload.subarray(IV_BYTES + AUTH_TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private getKey(): Buffer {
    const value = this.configService.get<string>('INTEGRATION_ENCRYPTION_KEY');
    if (!value) {
      throw new InternalServerErrorException(
        'INTEGRATION_ENCRYPTION_KEY must be configured before storing channel credentials',
      );
    }

    const key = Buffer.from(value, 'base64');
    if (key.length !== 32) {
      throw new InternalServerErrorException(
        'INTEGRATION_ENCRYPTION_KEY must be a base64-encoded 32-byte key',
      );
    }

    return key;
  }
}
