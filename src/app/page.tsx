import { redirect } from 'next/navigation';

// O middleware envia visitantes não autenticados para /login.
export default function Home() {
  redirect('/dashboard');
}
