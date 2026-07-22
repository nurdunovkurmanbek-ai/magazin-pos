import { describe, it, expect } from 'vitest';
import { PasswordService } from '../modules/auth/password.service';

describe('PasswordService', () => {
  it('hashes and verifies password', async () => {
    const hash = await PasswordService.hash('test-password-123');
    expect(hash).not.toBe('test-password-123');
    expect(await PasswordService.compare('test-password-123', hash)).toBe(true);
    expect(await PasswordService.compare('wrong-password', hash)).toBe(false);
  });

  it('produces different hashes for same password', async () => {
    const hash1 = await PasswordService.hash('same-password');
    const hash2 = await PasswordService.hash('same-password');
    expect(hash1).not.toBe(hash2);
  });
});
