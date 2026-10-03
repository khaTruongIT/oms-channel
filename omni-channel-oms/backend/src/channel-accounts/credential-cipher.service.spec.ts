import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CredentialCipherService } from './credential-cipher.service';

const validKey = Buffer.alloc(32, 7).toString('base64');

describe('CredentialCipherService', () => {
  it('encrypts credentials using authenticated encryption and round-trips them', () => {
    const configService = {
      get: jest.fn().mockReturnValue(validKey),
    } as unknown as ConfigService;
    const service = new CredentialCipherService(configService);

    const encrypted = service.encrypt('refresh-token-value');

    expect(encrypted).not.toContain('refresh-token-value');
    expect(service.decrypt(encrypted)).toBe('refresh-token-value');
  });

  it('rejects credential storage when the configured key is not a 32-byte base64 key', () => {
    const configService = {
      get: jest.fn().mockReturnValue('not-a-valid-key'),
    } as unknown as ConfigService;
    const service = new CredentialCipherService(configService);

    expect(() => service.encrypt('secret')).toThrow(
      InternalServerErrorException,
    );
  });
});
