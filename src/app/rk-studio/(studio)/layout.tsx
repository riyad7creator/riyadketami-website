import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect('/rk-studio/auth');
  if (session.user.role !== 'admin') redirect('/rk-studio/auth');

  return (
    <AdminShell user={session.user}>
      {children}
    </AdminShell>
  );
}
