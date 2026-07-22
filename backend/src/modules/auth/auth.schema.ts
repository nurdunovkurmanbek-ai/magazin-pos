import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'CASHIER', 'STOREKEEPER', 'ACCOUNTANT']);

/** Кирүү суроосу */
export const loginSchema = z.object({
  email: z.string().email('Жараксыз email'),
  password: z.string().min(6, 'Сырсөз кеминде 6 символ болушу керек'),
});

/** Токен жаңылоо суроосу */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh токен талап кылынат'),
});

/** Сырсөздү унутуу суроосу */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Жараксыз email'),
});

/** Сырсөздү калыбына келтирүү */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Токен талап кылынат'),
  password: z.string().min(8, 'Сырсөз кеминде 8 символ болушу керек'),
  confirmPassword: z.string().min(8, 'Сырсөздү ырастаңыз'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Сырсөздөр дал келбейт',
  path: ['confirmPassword'],
});

/** Колдонуучу түзүү суроосу */
export const createUserSchema = z.object({
  email: z.string().email('Жараксыз email'),
  password: z.string().min(8, 'Сырсөз кеминде 8 символ болушу керек'),
  firstName: z.string().min(1, 'Аты талап кылынат'),
  lastName: z.string().min(1, 'Фамилиясы талап кылынат'),
  role: roleEnum.optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
