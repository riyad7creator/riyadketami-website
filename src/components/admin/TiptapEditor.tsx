'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon,
  Image as ImageIcon, Undo, Redo, RemoveFormatting,
} from 'lucide-react';
import MediaPickerModal from './MediaPickerModal';
import { markMediaUsed } from '@/lib/media-storage';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** If provided, inserts via media library are tracked as used by this post */
  postId?: string;
  /** Text direction — pass 'rtl' for Arabic content */
  dir?: 'ltr' | 'rtl';
}

const btnCls =
  'p-1.5 rounded text-text-2 hover:text-text-0 hover:bg-white/[0.06] transition-colors duration-[var(--duration-fast)] disabled:opacity-30 disabled:cursor-not-allowed';
const activeCls = 'bg-matrix/15 text-matrix';

export default function TiptapEditor({ content, onChange, placeholder, postId, dir = 'ltr' }: TiptapEditorProps) {
  const [imgPickerOpen, setImgPickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'not-prose font-mono text-xs bg-bg-1 rounded p-4 border border-border overflow-x-auto' } } }),
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'rounded-[var(--radius-md)] border border-border max-w-full' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-matrix underline underline-offset-2 hover:text-matrix/70' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your post here...' }),
      CharacterCount,
    ],
    content,
    immediatelyRender: false,
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  const handleImageSelect = useCallback((url: string, mediaId: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
    if (postId && mediaId) void markMediaUsed(mediaId, postId);
  }, [editor, postId]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <>
      <div className="flex flex-col border border-border rounded-[var(--radius-md)] overflow-hidden focus-within:border-matrix/50 transition-colors duration-[var(--duration-fast)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-bg-1/60">
          <button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnCls}><Undo size={13} /></button>
          <button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnCls}><Redo size={13} /></button>
          <span className="w-px h-4 bg-border mx-1" />

          <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnCls} ${editor.isActive('heading', { level: 2 }) ? activeCls : ''}`}><Heading2 size={13} /></button>
          <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnCls} ${editor.isActive('heading', { level: 3 }) ? activeCls : ''}`}><Heading3 size={13} /></button>
          <span className="w-px h-4 bg-border mx-1" />

          <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnCls} ${editor.isActive('bold') ? activeCls : ''}`}><Bold size={13} /></button>
          <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnCls} ${editor.isActive('italic') ? activeCls : ''}`}><Italic size={13} /></button>
          <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnCls} ${editor.isActive('strike') ? activeCls : ''}`}><Strikethrough size={13} /></button>
          <button type="button" title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} className={`${btnCls} ${editor.isActive('code') ? activeCls : ''}`}><Code size={13} /></button>
          <span className="w-px h-4 bg-border mx-1" />

          <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnCls} ${editor.isActive('bulletList') ? activeCls : ''}`}><List size={13} /></button>
          <button type="button" title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnCls} ${editor.isActive('orderedList') ? activeCls : ''}`}><ListOrdered size={13} /></button>
          <button type="button" title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btnCls} ${editor.isActive('blockquote') ? activeCls : ''}`}><Quote size={13} /></button>
          <button type="button" title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnCls}><Minus size={13} /></button>
          <span className="w-px h-4 bg-border mx-1" />

          <button type="button" title="Link" onClick={addLink} className={`${btnCls} ${editor.isActive('link') ? activeCls : ''}`}><LinkIcon size={13} /></button>
          {/* Image — opens media picker instead of window.prompt */}
          <button
            type="button"
            title="Insert image from media library"
            onClick={() => setImgPickerOpen(true)}
            className={btnCls}
          >
            <ImageIcon size={13} />
          </button>
          <span className="w-px h-4 bg-border mx-1" />

          <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={btnCls}><RemoveFormatting size={13} /></button>

          <span className="ml-auto font-mono text-[10px] text-text-2 pr-1">{wordCount} words</span>
        </div>

        {/* Editor area */}
        <EditorContent
          editor={editor}
          dir={dir}
          className="min-h-[320px] bg-bg-1 px-4 py-3 prose prose-invert prose-sm max-w-none
            prose-headings:font-display prose-headings:text-text-0
            prose-p:text-text-1 prose-p:leading-relaxed
            prose-a:text-matrix prose-a:no-underline hover:prose-a:underline
            prose-code:text-matrix prose-code:bg-bg-0 prose-code:rounded prose-code:px-1
            prose-blockquote:border-matrix/40 prose-blockquote:text-text-2
            prose-hr:border-border
            prose-img:rounded-[var(--radius-md)]
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-2
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>

      {/* Image picker modal */}
      <MediaPickerModal
        open={imgPickerOpen}
        onClose={() => setImgPickerOpen(false)}
        onSelect={handleImageSelect}
        folder="blog"
        title="Insert image"
      />
    </>
  );
}
