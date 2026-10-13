'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Save, ImageIcon, Zap, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

interface SettingEntry {
  key: string;
  label: string;
  description: string;
  folder: 'hero' | 'blog' | 'uncategorized';
  shape: 'landscape' | 'circle';
}

const SETTINGS: SettingEntry[] = [
  {
    key: 'hero_image',
    label: 'Hero Image',
    description: 'Main portrait displayed in the homepage hero section.',
    folder: 'hero',
    shape: 'landscape',
  },
  {
    key: 'profile_image',
    label: 'Profile Image (Link-in-Bio)',
    description: 'Avatar shown on the /links page.',
    folder: 'uncategorized',
    shape: 'circle',
  },
];

interface SettingImageCardProps {
  entry: SettingEntry;
  currentUrl: string | null;
  onSave: (key: string, url: string) => Promise<void>;
}

function SettingImageCard({ entry, currentUrl, onSave }: SettingImageCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (url: string) => {
    setSaving(true);
    await onSave(entry.key, url);
    setSaving(false);
  };

  return (
    <div className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-semibold text-text-0">{entry.label}</h2>
        <p className="text-xs text-text-2 mt-0.5">{entry.description}</p>
      </div>

      <div
        className={`relative bg-bg-1 border border-border flex items-center justify-center overflow-hidden ${
          entry.shape === 'circle'
            ? 'w-24 h-24 rounded-full'
            : 'w-full aspect-video rounded-[var(--radius-md)]'
        }`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={entry.label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-2/40">
            <ImageIcon size={entry.shape === 'circle' ? 24 : 32} />
            <span className="font-mono text-[10px]">not set</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors"
        >
          {saving
            ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
            : <><Save size={13} /> Change image</>
          }
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={() => void onSave(entry.key, '')}
            className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-danger/50 hover:text-danger transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => void handleSelect(url)}
        folder={entry.folder}
        title={`Set ${entry.label}`}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = (await res.json()) as Record<string, string>;
        const mapped: Record<string, string | null> = {};
        for (const s of SETTINGS) mapped[s.key] = data[s.key] ?? null;
        setValues(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const handleSave = async (key: string, url: string) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: url || null }),
    });
    if (res.ok) {
      setValues((prev) => ({ ...prev, [key]: url || null }));
      toast(url ? 'Image updated' : 'Setting cleared', 'success');
    } else {
      toast('Failed to save setting', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// settings</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Settings</h1>
        <p className="text-sm text-text-2 mt-1">Configure sitewide images, AI, and appearance.</p>
      </div>

      {/* Sub-section nav cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/rk-studio/settings"
          className="glass border border-matrix/30 bg-matrix/[0.03] rounded-[var(--radius-lg)] p-4 flex items-center gap-3 group"
        >
          <div className="p-2 bg-matrix/10 rounded-[var(--radius-md)] shrink-0">
            <ImageIcon size={15} className="text-matrix" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-0">Site Images</p>
            <p className="text-xs text-text-2 mt-0.5">Hero, profile, and media settings</p>
          </div>
          <ChevronRight size={14} className="text-text-2 shrink-0" />
        </Link>

        <Link
          href="/rk-studio/settings/ai"
          className="glass border border-border rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:border-matrix/30 transition-colors group"
        >
          <div className="p-2 bg-surface rounded-[var(--radius-md)] shrink-0 group-hover:bg-matrix/10 transition-colors">
            <Zap size={15} className="text-text-2 group-hover:text-matrix transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-0">AI Settings</p>
            <p className="text-xs text-text-2 mt-0.5">OpenRouter key, models, usage</p>
          </div>
          <ChevronRight size={14} className="text-text-2 shrink-0" />
        </Link>
      </div>

      {/* Images section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={14} className="text-matrix/60" />
          <h2 className="text-sm font-semibold text-text-1">Site Images</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-text-2">
            <Loader2 size={16} className="animate-spin text-matrix" />
            <span className="font-mono text-xs">Loading settings...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {SETTINGS.map((entry) => (
              <SettingImageCard
                key={entry.key}
                entry={entry}
                currentUrl={values[entry.key] ?? null}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="font-mono text-[10px] text-text-2">
          // images are stored as base64 in MongoDB — changes take effect immediately
        </p>
      </div>
    </div>
  );
}
