'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, FolderOpen } from 'lucide-react';
import MediaPickerModal from './MediaPickerModal';
import { markMediaUsed } from '@/lib/media-storage';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** If provided, selected media is marked as used by this post */
  postId?: string;
}

export default function ImageUploader({ value, onChange, label = 'Featured image', postId }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Upload failed.');
      } else {
        onChange(data.url);
      }
    } catch {
      setError('Network error during upload.');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    void upload(files[0]!);
  }, [upload]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleLibrarySelect = (url: string, mediaId: string) => {
    onChange(url);
    if (postId && mediaId) void markMediaUsed(mediaId, postId);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="block text-xs font-medium text-text-2">{label}</span>

      {value ? (
        <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-border bg-bg-1 aspect-video">
          <Image
            src={value}
            alt="Featured image preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized={value.startsWith('data:')}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 rounded-full bg-bg-0/80 text-text-1 hover:text-danger transition-colors duration-[var(--duration-fast)]"
            title="Remove image"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-[var(--radius-sm)] bg-bg-0/80 text-text-1 text-xs hover:text-text-0 transition-colors duration-[var(--duration-fast)]"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 aspect-video rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors duration-[var(--duration-fast)]
            ${dragging ? 'border-matrix bg-matrix/[0.06]' : 'border-border hover:border-matrix/40 hover:bg-matrix/[0.02]'}`}
        >
          {uploading ? (
            <span className="font-mono text-xs text-text-2 animate-pulse">Uploading...</span>
          ) : (
            <>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-1 border border-border">
                {dragging ? <Upload size={16} className="text-matrix" /> : <ImageIcon size={16} className="text-text-2" />}
              </div>
              <div className="text-center">
                <p className="text-sm text-text-1">Drop an image or <span className="text-matrix">click to upload</span></p>
                <p className="text-xs text-text-2 mt-0.5">PNG, JPG, WebP, GIF — max 4 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Library picker + URL fallback row */}
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 glass border border-border text-text-1 text-xs rounded-[var(--radius-md)] hover:border-matrix/50 transition-colors shrink-0"
        >
          <FolderOpen size={12} /> Choose from library
        </button>
        <input
          type="url"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste an image URL..."
          className="flex-1 bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]"
        />
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleLibrarySelect}
        folder="blog"
        title="Choose featured image"
      />
    </div>
  );
}
