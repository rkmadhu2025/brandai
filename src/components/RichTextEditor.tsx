import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Heading2, Heading3, Quote, Code, RotateCcw, RotateCw } from 'lucide-react';

export const RichTextEditor = ({ content, onChange, placeholder }: { content: string, onChange: (val: string) => void, placeholder?: string }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] text-sm text-slate-700 leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden mb-2">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <RotateCw size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[150px] outline-none" />
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap { outline: none; }
        .tiptap p { margin-bottom: 0.75em; }
        .tiptap ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; margin-top: 0.5em; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; margin-top: 0.5em; }
        .tiptap ul li p, .tiptap ol li p { margin-bottom: 0.25em; }
        .tiptap blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
        .tiptap h2 { font-size: 1.5em; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
        .tiptap h3 { font-size: 1.17em; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
        .tiptap pre { background: #1e293b; color: #f8fafc; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.75em; }
        .tiptap code { font-family: monospace; background: #e2e8f0; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.875em; }
        .tiptap pre code { background: transparent; padding: 0; color: inherit; border-radius: 0; }
      `}} />
    </div>
  );
};
