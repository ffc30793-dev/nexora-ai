import { z } from 'zod';

/* ---------- Validação ---------- */

/** Só dígitos; 10 ou 11 dígitos (DDD + número) ganham o prefixo 55 do Brasil. */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
}

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, 'Nome muito longo.')
    .transform((v) => v || undefined),
  phone: z
    .string()
    .trim()
    .min(1, 'Informe o WhatsApp.')
    .transform(normalizePhone)
    .refine((v) => v.length >= 10 && v.length <= 15, 'Informe o WhatsApp com DDD, ex.: (86) 99999-9999.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'E-mail muito longo.')
    .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'E-mail inválido.')
    .transform((v) => v || undefined),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z
    .string()
    .trim()
    .min(1, 'Escreva uma mensagem.')
    .max(4000, 'Mensagem muito longa (máximo de 4000 caracteres).'),
});

export const uuidSchema = z.string().uuid();

/* ---------- Formatação ---------- */

const TZ = 'America/Fortaleza';

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    const cut = rest.length === 9 ? 5 : 4;
    return `+55 (${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}`;
  }
  return `+${d}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Hoje → "14:05"; antes → "13/11". */
export function formatShort(iso: string): string {
  const date = new Date(iso);
  const day = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: TZ });
  if (day(date) === day(new Date())) {
    return date.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
}

export const STATUS_LABEL: Record<string, string> = {
  open: 'Aberta',
  pending: 'Pendente',
  resolved: 'Resolvida',
};

export const MESSAGE_STATUS_LABEL: Record<string, string> = {
  queued: 'Na fila',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Falhou',
  received: 'Recebida',
};
