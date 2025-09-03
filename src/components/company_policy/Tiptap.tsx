import { useEditor, EditorContent, EditorContext, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useMemo } from 'react'

const Tiptap = () => {
    const editor = useEditor({
        extensions: [StarterKit], // define your extension array
        content: '<p>Hello World!</p>', // initial content
    })

    // Memoize the provider value to avoid unnecessary re-renders
    const providerValue = useMemo(() => ({ editor }), [editor])

    return (
        <EditorContext.Provider value={providerValue}>
            <div className="prose prose-lg max-w-none w-[1280px] h-[500px] border border-gray-300 overflow-hidden">
                <EditorContent editor={editor} className="h-full [&_.ProseMirror]:h-full [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none" />
            </div>
        </EditorContext.Provider>
    )
}

new Editor({
  extensions: [StarterKit],
})

export default Tiptap