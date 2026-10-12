/**
 * Vietnamese phone number normalizer utility
 * Normalizes variations of Vietnamese mobile numbers (+84, 84, spaces, dots, dashes)
 * into canonical 10-digit format (0[3|5|7|8|9]xxxxxxx)
 */

export function normalizeVNPhone(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  // Strip all non-digit and non-plus characters
  let cleaned = raw.trim().replace(/[\s\.\-\(\)]/g, '');

  if (!cleaned) {
    return null;
  }

  // Replace leading +84 or 84 with 0
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Validate canonical VN mobile format: 10 digits starting with 03, 05, 07, 08, 09
  const vnPhoneRegex = /^0(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

  if (vnPhoneRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}
