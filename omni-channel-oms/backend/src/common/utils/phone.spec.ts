import { normalizeVNPhone } from './phone';

describe('normalizeVNPhone', () => {
  it('should normalize standard 10-digit Vietnamese phone numbers', () => {
    expect(normalizeVNPhone('0901234567')).toBe('0901234567');
    expect(normalizeVNPhone('0388889999')).toBe('0388889999');
    expect(normalizeVNPhone('0791234567')).toBe('0791234567');
    expect(normalizeVNPhone('0851234567')).toBe('0851234567');
    expect(normalizeVNPhone('0561234567')).toBe('0561234567');
  });

  it('should normalize numbers starting with +84 or 84', () => {
    expect(normalizeVNPhone('+84901234567')).toBe('0901234567');
    expect(normalizeVNPhone('84901234567')).toBe('0901234567');
    expect(normalizeVNPhone('+84388889999')).toBe('0388889999');
  });

  it('should remove whitespace, dots, dashes, and parentheses', () => {
    expect(normalizeVNPhone('84 901.234.567')).toBe('0901234567');
    expect(normalizeVNPhone('090-123-4567')).toBe('0901234567');
    expect(normalizeVNPhone('(090) 123 4567')).toBe('0901234567');
    expect(normalizeVNPhone(' +84 901 234 567 ')).toBe('0901234567');
  });

  it('should return null for invalid, garbage, or non-Vietnamese numbers', () => {
    expect(normalizeVNPhone('abc')).toBeNull();
    expect(normalizeVNPhone('')).toBeNull();
    expect(normalizeVNPhone(null as any)).toBeNull();
    expect(normalizeVNPhone(undefined as any)).toBeNull();
    expect(normalizeVNPhone('12345')).toBeNull(); // Too short
    expect(normalizeVNPhone('01234567890123')).toBeNull(); // Too long
    expect(normalizeVNPhone('0101234567')).toBeNull(); // Invalid prefix 01
    expect(normalizeVNPhone('0201234567')).toBeNull(); // Invalid prefix 02
  });
});
