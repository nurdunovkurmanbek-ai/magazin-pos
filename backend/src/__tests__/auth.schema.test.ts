import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../modules/auth/auth.schema';

describe('auth schemas', () => {
  it('validates login input', () => {
    const result = loginSchema.safeParse({
      email: 'admin@magazin.kg',
      password: 'secret1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email on login', () => {
    const result = loginSchema.safeParse({
      email: 'not-email',
      password: 'secret1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password on login', () => {
    const result = loginSchema.safeParse({
      email: 'admin@magazin.kg',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('validates refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: 'abc' });
    expect(result.success).toBe(true);
  });

  it('validates forgot password email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@test.kg' });
    expect(result.success).toBe(true);
  });

  it('validates reset password with matching confirm', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'reset-token',
      password: 'newpass12',
      confirmPassword: 'newpass12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords on reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'reset-token',
      password: 'newpass12',
      confirmPassword: 'different1',
    });
    expect(result.success).toBe(false);
  });
});
