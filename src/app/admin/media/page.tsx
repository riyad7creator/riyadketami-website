'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Upload, ImageIcon, Copy, Pencil, Trash2, X,
  Check, Loader2, BarChart3, Play, FileJson, Info,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { MediaFile, MediaFolder } from '@/types/media';
import { getMediaFiles, deleteMedia, updateMedia, uploadMedia } from '@/lib/media-storage';
import {
  processImage,
  processBlogImage,
  processHeroImage,
  processLinkIcon,
  processOgImage,
} from '@/utils/image-processing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FOLDER_TABS: { value: MediaFolder | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'hero', label: 'hero' },
  { value: 'blog', label: 'blog' },
  { value: 'links', label: 'links' },
  { value: 'og', label: 'og' },
  { value: 'icons', label: 'icons' },
  { value: 'uncategorized', label: 'general' },
];

interface FolderHint {
  dimensions: string;
  ratio: string;
  formats: string;
  maxSize: string;
  note?: string;
}

const FOLDER_HINTS: Record<string, FolderHint> = {
  hero: {
    dimensions: '1920 × 1080 px',
    ratio: '16:9',
    formats: 'MP4 / WebM / JPEG / WebP',
    maxSize: 'Video ≤ 50 MB · Image ≤ 4 MB',
    note: 'Autoplay-muted-loop for video. Portrait cropped to 800×800 for mobile.',
  },
  blog: {
    dimensions: '1200 × 630 px',
    ratio: '1.91:1',
    formats: 'WebP / JPEG / PNG',
    maxSize: '≤ 4 MB',
    note: 'Also used as Open Graph thumbnail.',
  },
  links: {
    dimensions: '800 × 800 px',
    ratio: '1:1',
    formats: 'WebP / PNG / JPEG',
    maxSize: '≤ 4 MB',
    note: 'Displayed as card thumbnails on the /links page.',
  },
  og: {
    dimensions: '1200 × 630 px',
    ratio: '1.91:1',
    formats: 'JPEG / WebP',
    maxSize: '≤ 4 MB',
    note: 'Social share preview images. Strict 1.91:1 enforced by platforms.',
  },
  icons: {
    dimensions: '256 × 256 px',
    ratio: '1:1',
    formats: 'SVG (preferred) / WebP / PNG',
    maxSize: '≤ 4 MB',
    note: 'SVG scales perfectly. PNG/WebP will be displayed at 32–64 px.',
  },
  uncategorized: {
    dimensions: 'Any',
    ratio: 'Any',
    formats: 'JPEG / PNG / WebP / GIF / SVG / MP4 / WebM / Lottie JSON',
    maxSize: 'Image ≤ 4 MB · Video / Lottie ≤ 50 MB',
  },
};

const PAGE_SIZE = 24;
const STORAGE_BUDGET_BYTES = 96 * 1024 * 1024;

const ACCEPT_ALL = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,application/json';

interface MediaStats {
  totalFiles: number;
  totalSizeBytes: number;
  byFolder: Record<string, { count: number; sizeBytes: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isVideo(file: MediaFile) {
  return file.mediaType === 'video' || file.mimeType?.startsWith('video/');
}

function isLottie(file: MediaFile) {
  return file.mediaType === 'lottie' || file.mimeType === 'application/json';
}

type ProcessResult = { blob: Blob; width?: number; height?: number; mimeType: string };

async function processForFolder(file: File, folder: MediaFolder | 'all'): Promise<ProcessResult> {
  // Non-image files: pass through unchanged
  if (file.type.startsWith('video/') || file.type === 'application/json') {
    return { blob: file, mimeType: file.type };
  }
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { blob: file, mimeType: file.type };
  }
  switch (folder) {
    case 'links': { const r = await processLinkIcon(file); return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType }; }
    case 'hero': { const r = await processHeroImage(file); return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType }; }
    case 'blog': { const r = await processBlogImage(file); return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType }; }
    case 'og': { const r = await processOgImage(file); return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType }; }
    default: { const r = await processImage(file, { quality: 0.85, format: 'webp' }); return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType }; }
  }
}

// ---------------------------------------------------------------------------
// Folder hint card
// ---------------------------------------------------------------------------

function FolderHintCard({ folder }: { folder: MediaFolder | 'all' }) {
  const hint = folder !== 'all' ? FOLDER_HINTS[folder] : null;
  if (!hint) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="glass border border-matrix/20 rounded-[var(--radius-md)] px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5 items-start"
    >
      <div className="flex items-center gap-1.5">
        <Info size={12} className="text-matrix/60 shrink-0" />
        <span className="text-[11px] font-semibold text-matrix uppercase tracking-widest">{folder}</span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
        <span><span className="text-text-2">Dimensions:</span> <span className="text-text-1 font-mono">{hint.dimensions}</span></span>
        <span><span className="text-text-2">Ratio:</span> <span className="text-text-1 font-mono">{hint.ratio}</span></span>
        <span><span className="text-text-2">Formats:</span> <span className="text-text-1">{hint.formats}</span></span>
        <span><span className="text-text-2">Max size:</span> <span className="text-text-1">{hint.maxSize}</span></span>
        {hint.note && <span className="text-text-2 w-full">{hint.note}</span>}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Storage bar
// ---------------------------------------------------------------------------

function StorageBar({ stats, loading }: { stats: MediaStats | null; loading: boolean }) {
  if (loading) return <div className="h-10 bg-bg-1 rounded animate-pulse" />;
  if (!stats) return null;

  const pct = Math.min(100, (stats.totalSizeBytes / STORAGE_BUDGET_BYTES) * 100);

  return (
    <div className="glass border border-border rounded-[var(--radius-md)] px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-matrix/60" />
          <span className="font-mono text-xs text-text-2">
            Storage used: <span className="text-text-1">{fmtBytes(stats.totalSizeBytes)}</span>
            {' / '}~{fmtBytes(STORAGE_BUDGET_BYTES)}
            <span className="text-text-2 ml-1">(MongoDB Atlas free tier)</span>
          </span>
        </div>
        <span className="font-mono text-xs text-matrix">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-bg-1 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${pct > 85 ? 'bg-danger' : pct > 60 ? 'bg-amber-400' : 'bg-matrix'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="font-mono text-[10px] text-text-2">
        {stats.totalFiles} files total
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media card
// ---------------------------------------------------------------------------

interface MediaCardProps {
  file: MediaFile;
  onCopy: (url: string) => void;
  onDelete: (id: string, usedIn: string[]) => void;
  onAltSave: (id: string, altText: string) => Promise<void>;
}

function MediaCard({ file, onCopy, onDelete, onAltSave }: MediaCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altValue, setAltValue] = useState(file.altText ?? '');
  const [altSaving, setAltSaving] = useState(false);

  const saveAlt = async () => {
    setAltSaving(true);
    await onAltSave(file._id, altValue);
    setAltSaving(false);
    setEditingAlt(false);
  };

  const fileIsVideo = isVideo(file);
  const fileIsLottie = isLottie(file);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="group relative aspect-square rounded-[var(--radius-md)] border border-border overflow-hidden bg-bg-1"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => { setShowOverlay(false); setConfirmDelete(false); }}
    >
      {/* Thumbnail */}
      {fileIsVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-bg-2 relative">
          <video
            src={file.url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-2 bg-black/50 rounded-full">
              <Play size={18} className="text-white fill-white" />
            </div>
          </div>
        </div>
      ) : fileIsLottie ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-2 gap-2">
          <FileJson size={28} className="text-matrix/60" />
          <span className="text-[10px] font-mono text-matrix/80">Lottie</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt={file.altText || file.originalName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Folder badge */}
      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-mono bg-bg-0/80 text-matrix border border-matrix/20 rounded">
        {file.folder}
      </span>

      {/* Used-in badge */}
      {file.usedIn?.length > 0 && (
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-mono bg-bg-0/80 text-accent border border-accent/20 rounded">
          {file.usedIn.length} use{file.usedIn.length > 1 ? 's' : ''}
        </span>
      )}

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
        {editingAlt ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void saveAlt(); if (e.key === 'Escape') setEditingAlt(false); }}
              className="flex-1 bg-bg-0/90 border border-matrix/50 rounded px-1.5 py-0.5 text-[10px] text-text-0 focus:outline-none"
              placeholder="Alt text..."
            />
            <button onClick={() => void saveAlt()} disabled={altSaving} className="p-0.5 text-matrix hover:text-matrix/70">
              {altSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            </button>
            <button onClick={() => setEditingAlt(false)} className="p-0.5 text-text-2 hover:text-text-1">
              <X size={11} />
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-white/70 truncate leading-tight">{file.originalName}</p>
        )}
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {showOverlay && !editingAlt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-black/60 flex items-start justify-end gap-1 p-1.5"
          >
            <button onClick={() => onCopy(file.url)} className="p-1.5 bg-bg-0/80 rounded text-text-1 hover:text-matrix hover:bg-bg-0 transition-colors" title="Copy URL">
              <Copy size={12} />
            </button>
            {!fileIsVideo && !fileIsLottie && (
              <button onClick={() => { setAltValue(file.altText ?? ''); setEditingAlt(true); }} className="p-1.5 bg-bg-0/80 rounded text-text-1 hover:text-matrix hover:bg-bg-0 transition-colors" title="Edit alt text">
                <Pencil size={12} />
              </button>
            )}
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 bg-bg-0/80 rounded text-text-1 hover:text-danger hover:bg-bg-0 transition-colors" title="Delete">
              <Trash2 size={12} />
            </button>

            <AnimatePresence>
              {confirmDelete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-10 right-1.5 z-20 bg-bg-0 border border-danger/30 rounded-[var(--radius-md)] p-3 w-48 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-text-0 mb-0.5">Delete file?</p>
                  {file.usedIn?.length > 0 && (
                    <p className="text-[10px] text-warning mb-1.5">⚠ Used in {file.usedIn.length} place{file.usedIn.length > 1 ? 's' : ''}.</p>
                  )}
                  <p className="text-[10px] text-text-2 mb-2.5">This cannot be undone.</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => onDelete(file._id, file.usedIn)} className="flex-1 py-1 bg-danger/20 text-danger text-[11px] font-medium rounded hover:bg-danger/30 transition-colors">
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1 border border-border text-text-1 text-[11px] rounded hover:border-border-hover transition-colors">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone card
// ---------------------------------------------------------------------------

interface DropzoneCardProps {
  activeFolder: MediaFolder | 'all';
  onUploaded: (file: MediaFile) => void;
}

function DropzoneCard({ activeFolder, onUploaded }: DropzoneCardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setProgress(15);
    try {
      const targetFolder: MediaFolder = activeFolder === 'all' ? 'uncategorized' : activeFolder;
      setProgress(35);
      const processed = await processForFolder(file, activeFolder);
      setProgress(65);
      const ext = processed.mimeType.split('/')[1] ?? 'webp';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const saved = await uploadMedia(processed.blob, targetFolder, {
        filename: `${baseName}.${ext}`,
        width: processed.width,
        height: processed.height,
      });
      setProgress(100);
      setTimeout(() => {
        onUploaded(saved);
        setUploading(false);
        setProgress(0);
        toast('File uploaded successfully', 'success');
      }, 200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      toast(msg, 'error');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) void handleUpload(f); }}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={`relative aspect-square rounded-[var(--radius-md)] border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
        isDragging ? 'border-matrix bg-matrix/[0.08]' : uploading ? 'border-border cursor-default' : 'border-border hover:border-matrix/50 hover:bg-matrix/[0.02]'
      }`}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2 w-full px-4">
          <Loader2 size={18} className="text-matrix animate-spin" />
          <div className="w-full bg-bg-1 rounded-full h-1 overflow-hidden">
            <motion.div className="h-full bg-matrix rounded-full" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
          <span className="font-mono text-[10px] text-text-2">{progress < 50 ? 'processing...' : 'uploading...'}</span>
        </div>
      ) : (
        <>
          <Upload size={16} className="text-text-2" />
          <div className="text-center px-2">
            <p className="text-xs text-text-1">Drop or click</p>
            <p className="text-[9px] font-mono text-text-2 mt-0.5">Image · Video · Lottie</p>
          </div>
          {error && <p className="text-[9px] text-danger px-2 text-center leading-tight">{error}</p>}
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ALL}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminMediaPage() {
  const { toast } = useToast();

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<MediaFolder | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/media?stats=true');
      if (res.ok) setStats(await res.json() as MediaStats);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const loadFiles = useCallback(async (reset: boolean, pageNum?: number) => {
    setLoading(true);
    try {
      const p = reset ? 1 : (pageNum ?? page);
      const result = await getMediaFiles({
        folder: activeFolder === 'all' ? undefined : activeFolder,
        page: p,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      setFiles((prev) => (reset ? result.files : [...prev, ...result.files]));
      setTotal(result.total);
      if (reset) setPage(1);
    } catch {
      toast('Failed to load media files', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFolder, debouncedSearch, page, toast]);

  useEffect(() => { void loadFiles(true); }, [activeFolder, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFolder = (f: MediaFolder | 'all') => {
    setActiveFolder(f);
    setFiles([]);
    setPage(1);
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('URL copied to clipboard', 'success');
    } catch {
      toast('Copy failed — try manually', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedia(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      setTotal((t) => t - 1);
      toast('File deleted', 'success');
      void loadStats();
    } catch {
      toast('Delete failed', 'error');
    }
  };

  const handleAltSave = async (id: string, altText: string) => {
    await updateMedia(id, { altText });
    setFiles((prev) => prev.map((f) => f._id === id ? { ...f, altText } : f));
    toast('Alt text saved', 'success');
  };

  const handleUploaded = (file: MediaFile) => {
    setFiles((prev) => [file, ...prev]);
    setTotal((t) => t + 1);
    void loadStats();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// media-library</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Media Library</h1>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors"
        >
          <Upload size={14} /> Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ALL}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const targetFolder: MediaFolder = activeFolder === 'all' ? 'uncategorized' : activeFolder;
            void (async () => {
              try {
                const processed = await processForFolder(f, activeFolder);
                const ext = processed.mimeType.split('/')[1] ?? 'webp';
                const saved = await uploadMedia(processed.blob, targetFolder, {
                  filename: `${f.name.replace(/\.[^.]+$/, '')}.${ext}`,
                  width: processed.width,
                  height: processed.height,
                });
                handleUploaded(saved);
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Upload failed', 'error');
              }
            })();
            e.target.value = '';
          }}
        />
      </div>

      {/* Storage bar */}
      <StorageBar stats={stats} loading={statsLoading} />

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {FOLDER_TABS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFolder(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full font-mono transition-colors ${
                activeFolder === f.value
                  ? 'bg-matrix text-bg-0 font-bold'
                  : 'border border-border text-text-2 hover:border-matrix/50 hover:text-text-1'
              }`}
            >
              {f.label}
              {stats?.byFolder?.[f.value] && (
                <span className="ml-1.5 opacity-60">({stats.byFolder[f.value]!.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-bg-1 border border-border rounded-[var(--radius-md)] pl-8 pr-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors"
          />
        </div>
      </div>

      {/* Folder hint card */}
      <AnimatePresence mode="wait">
        {activeFolder !== 'all' && <FolderHintCard key={activeFolder} folder={activeFolder} />}
      </AnimatePresence>

      {/* Grid */}
      {loading && files.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-matrix animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <DropzoneCard activeFolder={activeFolder} onUploaded={handleUploaded} />

            <AnimatePresence mode="popLayout">
              {files.map((file, i) => (
                <motion.div
                  key={file._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.15 }}
                >
                  <MediaCard
                    file={file}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                    onAltSave={handleAltSave}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {files.length === 0 && !loading && (
            <div className="text-center py-16 col-span-full">
              <ImageIcon size={40} className="mx-auto text-text-2/20 mb-3" />
              <p className="font-mono text-xs text-text-2">// no files found</p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-3 text-xs text-matrix hover:underline">
                  Clear search
                </button>
              )}
            </div>
          )}

          {files.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-text-2">
                Showing {files.length} of {total} files
              </span>
              {files.length < total && (
                <button
                  onClick={() => { const next = page + 1; setPage(next); void loadFiles(false, next); }}
                  disabled={loading}
                  className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-matrix/50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : `Load more (${total - files.length} remaining)`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
