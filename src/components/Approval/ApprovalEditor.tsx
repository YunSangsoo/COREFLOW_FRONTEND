import axios from "axios";
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import { TableHeader } from "@tiptap/extension-table-header";
import './Approval.css'
import '@tiptap/starter-kit';

interface User {
    id: number;
    name:string;
}

// 툴바 컴포넌트: ApprovalEditor 컴포넌트 내부에서만 사용
const Toolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('URL을 입력하세요');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            {/* 볼드, 이탤릭, 밑줄, 취소선 */}
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>B</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>I</button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>U</button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>S</button>
            
            {/* 정렬 */}
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>Left</button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>Center</button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>Right</button>
            <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}>Justify</button>

            {/* 리스트 및 인용 */}
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>Bullet</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>Ordered</button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>Quote</button>
            
            {/* 구분선 */}
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>HR</button>

            {/* 링크, 이미지, 테이블, 코드 */}
            <button onClick={addImage}>Image</button>
            <button onClick={addTable}>Table</button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''}>Code Block</button>
            <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''}>Code</button>
        </div>
    );
};

const ApprovalForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [approver, setApprover] = useState('');
  const [cc, setCc] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFile(e.target.files[0]);
    }
  };
  //입력 에디터
  const editor = useEditor({
    extensions: [StarterKit,TextAlign.configure({
        types: ['heading','paragraph'],
        alignments:['left','center','right','justify'],
    }),
    Underline,
    Image.configure({
        inline:true,
        allowBase64:true,
    }),
    Link,
    TableHeader,
    TableRow,
    TableCell,
    ],
    content: '',
    onUpdate: ({editor}) => {
        setEditorValue(editor.getHTML());
    },
  });

  // 백엔드 통신함수
  const handleSubmit = async (status: 'DRAFT' | 'SUBMIT') => {
    if (!user) {
      alert("사용자 정보가 없습니다.");
      return;
    }

    
    const approvalData = {
      approvalTitle: title,
      approvalDetail: editor.getHTML(),
      userNo: user.id,
      approvalType: '일반결재', 
      approvalStatus: status === 'SUBMIT' ? 1 : 0, // 1: 진행, 0: 임시저장
      saveDate: new Date().toISOString(),

      // 결재선 정보
      lines: [
        {
          approverUserNo: parseInt(approver), 
          lineOrder: 1,
          status: status === 'SUBMIT' ? 'WAITING' : 'PENDING'
        },
        //참조자
        {
          approverUserNo: parseInt(cc),
          lineOrder: 2,
          status: 'PENDING'
        }
      ],

      // 첨부파일 정보 
      files: attachedFile
        ? [
            {
              originalFileName: attachedFile.name,
              filePath: '', 
              fileSize: attachedFile.size
            }
          ]
        : []
    };

    try {
      await axios.post("/api/approvals", approvalData, {
        headers: { "Content-Type": "application/json" },
      });
      alert(status === "SUBMIT" ? "상신 완료!" : "임시저장 완료!");
    } catch (err) {
      console.error(err);
      alert("문서 제출에 실패했습니다.");
    }
  };

  return (
    <div>
      <div>
        <button type="button" onClick={() => window.location.reload()}>초기화</button>
        <button type="button" onClick={() => handleSubmit("DRAFT")}>임시저장</button>
        <button type="button" onClick={() => handleSubmit("SUBMIT")}>상신</button>
        <button>결재선</button>
        <input type="file" id="file-attach" onChange={handleFileChange} style={{ display: 'none' }} />
        <button onClick={() => document.getElementById('file-attach')?.click()}>파일첨부</button>
      </div>

      <div>
        <div>
          <label>작성일자</label>
          <input type="text" readOnly value={new Date().toLocaleDateString()} />
        </div>
        <div>
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>
        <div>
          <label>결재자</label>
          <input type="text" value={approver} onChange={(e) => setApprover(e.target.value)} />
        </div>
        <div>
          <label>참조자</label>
          <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} />
        </div>
      </div>
      <Toolbar editor={editor}/>
      <EditorContent editor={editor}/>
    </div>
  );
};

export default ApprovalForm;