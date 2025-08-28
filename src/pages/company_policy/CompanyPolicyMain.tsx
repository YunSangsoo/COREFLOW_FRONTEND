import style from "./CompanyPolicyMain.module.css"
import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'summernote/dist/summernote-lite.min.js';
import 'summernote/dist/summernote-lite.min.css';

export default function CompanyPolicyMain() {
    return (
        <div className={style["company-policy-main"]}>
            <header>
                <h1 style={{textAlign:"center"}}>CoreFlow 내부 규정</h1>
            </header>
            <main>
                <input type="text" name="title" id="title" className={style.title} placeholder="제목" />
                {/* <textarea name="content" id="content" className={style.content} placeholder="내용"></textarea> */}
                <SummernoteEditor />
            </main>
            <footer>

            </footer>
        </div>
    )
}

// Summernote 타입 확장 (필요시)
declare global {
    interface JQuery {
        summernote(options?: any): JQuery;
        summernote(method: string, ...args: any[]): any;
    }
}

interface SummernoteEditorProps {
    onChange?: (content: string) => void;
    initialValue?: string;
}

const SummernoteEditor: React.FC<SummernoteEditorProps> = ({
    onChange,
    initialValue = ''
}) => {
    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editorRef.current) {
            $(editorRef.current).summernote({
                height: 500,
                width: 1280,
                toolbar: [
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['font', ['strikethrough', 'superscript', 'subscript']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['height', ['height']]
                ],
                callbacks: {
                    onChange: (contents: string) => {
                        onChange?.(contents);
                    }
                }
            });

            // 초기값 설정
            if (initialValue) {
                $(editorRef.current).summernote('code', initialValue);
            }
        }

        return () => {
            if (editorRef.current) {
                $(editorRef.current).summernote('destroy');
            }
        };
    }, [onChange, initialValue]);

    return <textarea ref={editorRef} name="content" id="content" className="summernote" placeholder="내용" />;
};