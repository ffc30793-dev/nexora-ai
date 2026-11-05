import { z } from 'zod';

const email = z
  .string({ required_error: 'Informe seu e-mail.' })
  .trim()
  .toLowerCase()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'E-mail muito longo.')
  .email('Informe um e-mail válido.');

const password = z
  .string({ required_error: 'Informe uma senha.' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
  .regex(/\d/, 'A senha deve conter ao menos um número.');

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Informe seu nome.').max(100, 'Nome muito longo.'),
    businessName: z.string().trim().min(2, 'Informe o nome da empresa.').max(120, 'Nome muito longo.'),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.').max(72),
});

export const emailSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });
