import { useEditor, EditorContent, EditorContext, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo } from 'react'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'

const Tiptap = ({ name, value, disabled, onChange }: { name: string, value: string, disabled: boolean, onChange: (str: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ], // define your extension array
        content: value, // initial content
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange && onChange(html); // 부모에게 변경사항 전달
        },
        editable: !disabled,
    });

    // Memoize the provider value to avoid unnecessary re-renders
    const providerValue = useMemo(() => ({ editor }), [editor]);

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <EditorContext.Provider value={providerValue}>
            <div className="prose prose-lg max-w-none w-[1280px] h-[500px] border border-gray-300 overflow-hidden">
                <EditorContent editor={editor}
                    className="h-full [&_.ProseMirror]:h-full [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-4" />
            </div>
            <input type="hidden" name={name} value={value || ''} />
        </EditorContext.Provider>
    )
}

new Editor({
    extensions: [StarterKit],
})

export default Tiptap