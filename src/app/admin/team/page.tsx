'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface MemberForm {
  name: string;
  email: string;
  role: string;
  password: string;
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
const labelCls = 'block text-xs font-medium text-text-2 mb-1';

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset } = useForm<MemberForm>({ defaultValues: { role: 'editor' } });

  useEffect(() => {
    fetch('/api/team')
      .then((r) => r.json())
      .then((data: Member[]) => { setMembers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (data: MemberForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const member = await res.json() as Member;
      setMembers((prev) => [member, ...prev]);
      reset({ role: 'editor' });
      setAdding(false);
    } else {
      const err = await res.json() as { error?: string };
      setError(err.error ?? 'Failed to add member.');
    }
    setSaving(false);
  };

  const roleBadge = (role: string) => {
    const cls =
      role === 'admin' ? 'text-matrix' : role === 'editor' ? 'text-accent' : 'text-text-2';
    return <span className={`font-mono text-[10px] uppercase tracking-widest ${cls}`}>{role}</span>;
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// access</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Team</h1>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          <Plus size={14} /> Add member
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit(handleAdd)}
          className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
        >
          <h2 className="text-sm font-medium text-text-0">New team member</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input {...register('name', { required: true })} placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input {...register('email', { required: true })} type="email" placeholder="email@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select {...register('role')} className={inputCls}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Password *</label>
              <input {...register('password', { required: true })} type="password" placeholder="Min 8 characters" className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]">
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setError(''); reset({ role: 'editor' }); }} className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : members.length === 0 ? (
        <p className="font-mono text-xs text-text-2 py-8">No team members yet.</p>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-1/60">
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest">Name</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest">Email</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-24">Role</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-bg-1/40 transition-colors duration-[var(--duration-fast)]">
                  <td className="px-4 py-3 text-text-1">{m.name}</td>
                  <td className="px-4 py-3 text-text-2 text-xs">{m.email}</td>
                  <td className="px-4 py-3">{roleBadge(m.role)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (!confirm(`Remove ${m.name}?`)) return;
                        setMembers((prev) => prev.filter((x) => x._id !== m._id));
                      }}
                      className="text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
