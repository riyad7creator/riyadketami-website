import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    // x-pathname is set by middleware for studio requests
    const from = (await headers()).get('x-pathname') ?? '';
    const back = from.startsWith('/rk-studio') && !from.startsWith('/rk-studio/auth') ? from : '';
    redirect(back ? `/rk-studio/auth?callbackUrl=${encodeURIComponent(back)}` : '/rk-studio/auth');
  }

  return (
    <AdminShell user={session.user}>
      {children}
    </AdminShell>
  );
}
