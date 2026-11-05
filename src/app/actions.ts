'use server';

import { redirect } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import { sanitizeNext } from '@/lib/safe-redirect';
import type { ActionState } from '@/lib/action-state';
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/validation';

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
};

function friendlyError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.';
    case 'weak_password':
      return 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.';
    case 'same_password':
      return 'A nova senha deve ser diferente da atual.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Não foi possível concluir o cadastro com estes dados.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Sua sessão expirou. Solicite um novo link.';
    default:
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    fullName: str(formData, 'fullName'),
    businessName: str(formData, 'businessName'),
    email: str(formData, 'email'),
    password: str(formData, 'password'),
    confirmPassword: str(formData, 'confirmPassword'),
  };
  const values = { fullName: raw.fullName, businessName: raw.businessName, email: raw.email };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }
  const { fullName, businessName, email, password } = parsed.data;

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Lidos pelo trigger handle_new_user (perfil + empresa).
      data: { full_name: fullName, business_name: businessName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: friendlyError(error), values };

  redirect(`/confirmar-email?email=${encodeURIComponent(email)}`);
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = { email: str(formData, 'email'), password: str(formData, 'password') };
  const values = { email: raw.email };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === 'email_not_confirmed') {
      redirect(`/confirmar-email?email=${encodeURIComponent(parsed.data.email)}`);
    }
    return { error: friendlyError(error), values };
  }

  redirect(sanitizeNext(formData.get('next')));
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = { email: str(formData, 'email') };
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });
  if (error && (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')) {
    return { error: friendlyError(error), values: raw };
  }

  // Resposta idêntica exista ou não a conta (evita enumeração de usuários).
  return {
    success: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
    values: raw,
  };
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: str(formData, 'password'),
    confirmPassword: str(formData, 'confirmPassword'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?erro=sessao-expirada');

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyError(error) };

  redirect('/dashboard');
}

export async function resendConfirmationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = { email: str(formData, 'email') };
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'E-mail inválido. Volte ao cadastro e tente novamente.' };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
  });
  if (error && (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')) {
    return { error: friendlyError(error) };
  }
  return { success: 'Se houver um cadastro pendente, reenviamos o e-mail de confirmação.' };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
