// src/components/shared/RichTextEditor.tsx
"use client";

import type { Editor } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Pilcrow, Quote, Code, Link2, WrapText, Eraser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const formattingOptions = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold'), label: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic'), label: 'Italic' },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline'), label: 'Underline' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive('strike'), label: 'Strikethrough' },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }), label: 'Heading 1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }), label: 'Heading 2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }), label: 'Heading 3' },
    { icon: Pilcrow, action: () => editor.chain().focus().setParagraph().run(), isActive: editor.isActive('paragraph'), label: 'Paragraph' },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList'), label: 'Bullet List' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList'), label: 'Ordered List' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive('blockquote'), label: 'Blockquote' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive('codeBlock'), label: 'Code Block' },
    { icon: Link2, action: setLink, isActive: editor.isActive('link'), label: 'Set Link'},
    { icon: WrapText, action: () => editor.chain().focus().setHardBreak().run(), label: 'Hard Break' },
    { icon: Eraser, action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(), label: 'Clear Format' },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-input bg-muted/50 rounded-t-md">
      {formattingOptions.map(opt => (
        <Toggle
          key={opt.label}
          size="sm"
          pressed={opt.isActive || false}
          onPressedChange={opt.action}
          disabled={!editor.isEditable || (opt.label === 'Set Link' && editor.state.selection.empty && !editor.isActive('link'))}
          aria-label={opt.label}
          title={opt.label}
        >
          <opt.icon className="h-4 w-4" />
        </Toggle>
      ))}
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder, editable = true }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude specific marks/nodes if not needed, or configure them
        // For example, to disable dropcursor:
        // dropcursor: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false, // Open links on click in editor
        autolink: true,      // Autolink URLs as you type
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-input rounded-md shadow-sm bg-background">
      {editable && <MenuBar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn(
            "prose prose-sm max-w-none min-h-[200px] p-3 focus:outline-none",
            editable ? "focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-b-md" : ""
        )}
      />
    </div>
  );
}
