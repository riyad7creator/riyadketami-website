'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Search, ImageIcon, Check, Loader2 } from 'lucide-react';
import type { MediaFile, MediaFolder } from '@/types/media';
import { getMediaFiles, uploadMedia } from '@/lib/media-storage';
import {
  processImage,
  processBlogImage,
  processHeroImage,
  processLinkIcon,
  processOgImage,
} from '@/utils/image-processing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with (dataUrl, mongoId) when the user confirms a selection */
  onSelect: (url: string, mediaId: string) => void;
  /** If set, library pre-filters to this folder and upload saves there */
  folder?: MediaFolder;
  allowUpload?: boolean;
  title?: string;
}

const FOLDER_TABS: { value: MediaFolder | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'blog', label: 'blog' },
  { value: 'hero', label: 'hero' },
  { value: 'links', label: 'links' },
  { value: 'og', label: 'og' },
  { value: 'icons', label: 'icons' },
  { value: 'uncategorized', label: 'general' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ProcessResult = { blob: Blob; width?: number; height?: number; mimeType: string };

async function processForFolder(file: File, folder: MediaFolder | 'all'): Promise<ProcessResult> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return { blob: file, mimeType: file.type };
  }
  switch (folder) {
    case 'links': {
      const r = await processLinkIcon(file);
      return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType };
    }
    case 'hero': {
      const r = await processHeroImage(file);
      return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType };
    }
    case 'blog': {
      const r = await processBlogImage(file);
      return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType };
    }
    case 'og': {
      const r = await processOgImage(file);
      return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType };
    }
    default: {
      const r = await processImage(file, { quality: 0.85, format: 'webp' });
      return { blob: r.blob, width: r.width, height: r.height, mimeType: r.mimeType };
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  folder: propFolder,
  allowUpload = true,
  title = 'Select Image',
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<'upload' | 'library'>(allowUpload ? 'upload' : 'library');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<MediaFolder | 'all'>(propFolder ?? 'all');

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  // Load library files
  const loadFiles = useCallback(async (reset: boolean, pageNum?: number) => {
    setFilesLoading(true);
    try {
      const p = reset ? 1 : (pageNum ?? page);
      const result = await getMediaFiles({
        folder: activeFolder === 'all' ? undefined : activeFolder,
        page: p,
        limit: 24,
        search: debouncedSearch || undefined,
      });
      setFiles((prev) => (reset ? result.files : [...prev, ...result.files]));
      setTotal(result.total);
      if (reset) setPage(1);
    } catch {
      // silent — empty grid shown
    } finally {
      setFilesLoading(false);
    }
  }, [activeFolder, debouncedSearch, page]);

  // Reload on open / folder / search change
  useEffect(() => {
    if (open && tab === 'library') void loadFiles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, activeFolder, debouncedSearch]);

  // Handle folder change inside modal
  const changeFolder = (f: MediaFolder | 'all') => {
    setActiveFolder(f);
    setFiles([]);
    setPage(1);
  };

  // Upload handler
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadProgress(10);

    try {
      const targetFolder: MediaFolder = propFolder ?? 'uncategorized';
      setUploadProgress(30);

      const processed = await processForFolder(file, propFolder ?? 'all');
      setUploadProgress(65);

      const ext = processed.mimeType.split('/')[1] ?? 'webp';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const saved = await uploadMedia(processed.blob, targetFolder, {
        filename: `${baseName}.${ext}`,
        width: processed.width,
        height: processed.height,
      });

      setUploadProgress(100);
      setTimeout(() => {
        onSelect(saved.url, saved._id);
        onClose();
        setUploading(false);
        setUploadProgress(0);
      }, 250);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [propFolder, onSelect, onClose]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUpload(file);
    e.target.value = '';
  };

  const handleSelect = (file: MediaFile) => {
    onSelect(file.url, file._id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full sm:max-w-4xl bg-bg-0 border border-border rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] flex flex-col overflow-hidden"
            style={{ maxHeight: '90dvh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <span className="font-mono text-[10px] text-matrix tracking-[0.15em]">// media</span>
                <h2 className="font-display font-bold text-base text-text-0 leading-tight">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[var(--radius-md)] text-text-2 hover:text-text-0 hover:bg-surface transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            {allowUpload && (
              <div className="flex gap-1 px-5 pt-3 pb-1 shrink-0">
                {(['upload', 'library'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-xs rounded-full font-mono transition-colors ${
                      tab === t
                        ? 'bg-matrix text-bg-0 font-bold'
                        : 'text-text-2 hover:text-text-1 border border-border'
                    }`}
                  >
                    {t === 'upload' ? '↑ upload' : '◫ library'}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === 'upload' ? (
                <div className="flex flex-col gap-3">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-4 min-h-52 rounded-[var(--radius-lg)] border-2 border-dashed cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-matrix bg-matrix/[0.06]'
                        : uploading
                          ? 'border-border'
                          : 'border-border hover:border-matrix/50 hover:bg-matrix/[0.02]'
                    }`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-4 w-full px-12">
                        <Loader2 size={24} className="text-matrix animate-spin" />
                        <div className="w-full bg-bg-1 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="h-full bg-matrix rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="font-mono text-xs text-text-2">
                          {uploadProgress < 50 ? 'Processing image...' : 'Uploading...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-bg-1 border border-border">
                          {isDragging
                            ? <Upload size={20} className="text-matrix" />
                            : <ImageIcon size={20} className="text-text-2" />}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-text-1">
                            Drop image or <span className="text-matrix">click to browse</span>
                          </p>
                          <p className="text-xs text-text-2 mt-1">JPG · PNG · GIF · SVG · WebP · max 10 MB</p>
                          {propFolder && (
                            <p className="text-xs font-mono text-matrix/50 mt-1">→ saves to /{propFolder}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-xs text-danger text-center">{uploadError}</p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Folder + search row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {FOLDER_TABS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => changeFolder(f.value)}
                          className={`px-3 py-1 text-xs rounded-full font-mono transition-colors ${
                            activeFolder === f.value
                              ? 'bg-matrix text-bg-0 font-bold'
                              : 'border border-border text-text-2 hover:border-matrix/50 hover:text-text-1'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative sm:w-44 shrink-0">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-2 pointer-events-none" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-bg-1 border border-border rounded-[var(--radius-md)] pl-7 pr-3 py-1.5 text-xs text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Grid */}
                  {filesLoading && files.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={20} className="text-matrix animate-spin" />
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-16">
                      <ImageIcon size={32} className="mx-auto text-text-2/30 mb-3" />
                      <p className="font-mono text-xs text-text-2">// no images found</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {files.map((file, i) => (
                          <motion.button
                            key={file._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02, duration: 0.15 }}
                            onClick={() => handleSelect(file)}
                            className="group relative aspect-square rounded-[var(--radius-md)] border border-border overflow-hidden bg-bg-1 hover:border-matrix/50 transition-all focus:outline-none focus:border-matrix"
                            title={file.altText || file.originalName}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={file.url}
                              alt={file.altText || file.originalName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-matrix flex items-center justify-center shadow-lg">
                                <Check size={14} className="text-bg-0" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Load more */}
                      {files.length < total && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-mono text-xs text-text-2">
                            {files.length} / {total} images
                          </span>
                          <button
                            onClick={() => {
                              const next = page + 1;
                              setPage(next);
                              void loadFiles(false, next);
                            }}
                            disabled={filesLoading}
                            className="px-4 py-1.5 glass border border-border text-text-1 text-xs rounded-[var(--radius-md)] hover:border-matrix/50 transition-colors disabled:opacity-50"
                          >
                            {filesLoading ? 'Loading...' : `Load ${Math.min(24, total - files.length)} more`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
