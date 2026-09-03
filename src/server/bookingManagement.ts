import crypto from 'crypto';

const MANAGEMENT_KEY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function randomManagementKey(length = 10): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, byte => MANAGEMENT_KEY_ALPHABET[byte % MANAGEMENT_KEY_ALPHABET.length]).join('');
}

export function hashManagementKey(appointmentId: string, managementKey: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(managementKey, Buffer.concat([salt, Buffer.from(appointmentId)]), 32);
  return `scrypt-v1:${salt.toString('base64url')}:${derived.toString('base64url')}`;
}

export function verifyManagementKey(appointmentId: string, managementKey: string, storedHash: string): boolean {
  const [version, saltEncoded, expectedEncoded] = storedHash.split(':');
  if (version !== 'scrypt-v1' || !saltEncoded || !expectedEncoded) return false;
  try {
    const salt = Buffer.from(saltEncoded, 'base64url');
    const expected = Buffer.from(expectedEncoded, 'base64url');
    const actual = crypto.scryptSync(managementKey, Buffer.concat([salt, Buffer.from(appointmentId)]), expected.length);
    return expected.length > 0 && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function randomBookingCode(): string {
  return `GWEN-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

export function isBookingCodeCollision(error: any): boolean {
  if (error?.code === 'BOOKING_CODE_COLLISION') return true;
  if (error?.code !== '23505') return false;
  const detail = `${error?.constraint || ''} ${error?.detail || ''} ${error?.message || ''}`.toLowerCase();
  return detail.includes('codigo') || detail.includes('appointments_codigo');
}
