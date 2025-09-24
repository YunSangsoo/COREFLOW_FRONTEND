import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import { TableHeader } from "@tiptap/extension-table-header";
import './ApprovalForm.css';
import '@tiptap/starter-kit';
import { useNavigate, useParams } from "react-router-dom"; 

import {
 Box,
 Button,
 Checkbox,
 Dialog,
 DialogActions,
 DialogContent,
 DialogTitle,
 Divider,
 List,
 ListItemButton,
 ListItemIcon,
 ListItemText,
 Stack,
 TextField,
 Typography,
} from "@mui/material";

export type Member = { userNo: number, userName: string, email?: string, depId?: number };
export type Department = { depId: number, depName: string };
interface AuthState {
    user: { userNo: number; userName: string } | null;
    accessToken: string | null;
}

function useDebounce<T>(value: T, delay = 250) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return v;
}

function PeoplePickerDialog({ open, onClose, onConfirm, initialSelected = [], presetQuery,excludeUserNo }: { open: boolean, onClose: () => void, onConfirm: (picked: Member[]) => void, initialSelected?: Member[], presetQuery?: string, excludeUserNo?: number}) {
    const [deps, setDeps] = useState<Department[]>([]);
    const [activeDepId, setActiveDepId] = useState<number | "">("");
    const [q, setQ] = useState(presetQuery ?? "");
    const dq = useDebounce(q, 250);
    const [rows, setRows] = useState<Member[]>([]);
    const [selected, setSelected] = useState<Map<number, Member>>(new Map());
    const [hasFetchedDeps, setHasFetchedDeps] = useState(false);
    const accessToken = useSelector((state: { auth: AuthState }) => state.auth.accessToken);

    useEffect(() => {
        if (open) {
            const map = new Map<number, Member>();
            initialSelected.forEach((m) => map.set(m.userNo, m));
            setSelected(map);
        }
    }, [open, initialSelected]);

    useEffect(() => {
        if (!open || !accessToken || hasFetchedDeps) return;
        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:8081/api/departments', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setDeps(response.data);
                setHasFetchedDeps(true);
            } catch (error) {
                console.error("부서 목록을 불러오는 데 실패했습니다:", error);
            }
        };
        fetchDepartments();
    }, [open, accessToken, hasFetchedDeps]);

    useEffect(() => {
        if (!open || !accessToken) return;
        const searchMembers = async () => {
            try {
                const response = await axios.get('http://localhost:8081/api/members', {
                    params: { query: dq || undefined, depId: activeDepId === "" ? undefined : Number(activeDepId), limit: 50 },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setRows(response.data);
            } catch (error) {
                console.error("사용자 검색에 실패했습니다:", error);
            }
        };
        searchMembers();
    }, [open, dq, activeDepId, accessToken]);

    const list = useMemo(() => {
    if (excludeUserNo) {

        const selfInList = rows.find(m => m.userNo == excludeUserNo); 
        if (selfInList) {
            if (selfInList.userNo !== excludeUserNo) {
            } else {
            }
        } else {
        }
    }

    if (!excludeUserNo) {
        return rows;
    }
    return rows.filter(m => m.userNo !== excludeUserNo);
}, [rows, excludeUserNo]);



    const toggle = (m: Member) => {
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(m.userNo)) next.delete(m.userNo);
            else next.set(m.userNo, m);
            return next;
        });
    };
    const handleConfirm = () => onConfirm(Array.from(selected.values()));

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>참석자 선택</DialogTitle>
            <DialogContent>
                <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 2, minHeight: 440 }}>
                    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden", bgcolor: "background.paper" }}>
                        <Box sx={{ p: 1.5, fontWeight: 600 }}>부서</Box>
                        <Divider />
                        <List dense disablePadding sx={{ maxHeight: 380, overflow: "auto" }}>
                            <ListItemButton selected={activeDepId === ""} onClick={() => setActiveDepId("")}>
                                <ListItemText primary="전체" />
                            </ListItemButton>
                            {deps.map((d) => (
                                <ListItemButton key={d.depId} selected={activeDepId === d.depId} onClick={() => setActiveDepId(d.depId)}>
                                    <ListItemText primary={d.depName} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Box>
                    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <Box sx={{ p: 1.5 }}>
                            <TextField fullWidth size="small" placeholder="이름/이메일 검색" value={q} onChange={(e) => setQ(e.target.value)} />
                        </Box>
                        <Divider />
                        <Box sx={{ px: 1.5, py: 1, fontWeight: 600 }}>사원 목록</Box>
                        <Box sx={{ flex: 1, overflow: "auto" }}>
                            {list.length === 0 ? (
                                <Stack alignItems="center" justifyContent="center" sx={{ height: 320 }}>
                                    <Typography variant="body2" color="text.secondary">검색 결과가 없습니다.</Typography>
                                </Stack>
                            ) : (
                                <List dense>
                                    {list.map((m) => (
                                        <ListItemButton key={m.userNo} onClick={() => toggle(m)} disableRipple>
                                            <ListItemIcon>
                                                <Checkbox edge="start" checked={selected.has(m.userNo)} tabIndex={-1} />
                                            </ListItemIcon>
                                            <ListItemText primary={`${m.userName} (${m.email ?? ""})`} secondary={m.depId ? `DEP:${m.depId}` : undefined} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button variant="contained" onClick={handleConfirm}>선택 완료</Button>
            </DialogActions>
        </Dialog>
    );
}

const Toolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    if (!editor) return null;

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
        <div className="edbtn">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>U</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>S</button>
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>Left</button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>Center</button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>Right</button>
          <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}>Justify</button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>Bullet</button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>Ordered</button>
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>Quote</button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>HR</button>
          <button onClick={addImage}>Image</button>
          <button onClick={addTable}>Table</button>
        </div>
    );
};

const ApprovalForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [approvalId] = useState<number | null>(id ? parseInt(id, 10) : null);
    const [title, setTitle] = useState('');
    const [approver, setApprover] = useState('');
    const [cc, setCc] = useState('');
    const [approverUserNo, setApproverUserNo] = useState<number[]>([]);
    const [ccUserNo, setCcUserNo] = useState<number[]>([]);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
    const [isCcModalOpen, setIsCcModalOpen] = useState(false);
    const [initialApprovers, setInitialApprovers] = useState<Member[]>([]);
    const [initialCCs, setInitialCCs] = useState<Member[]>([]);
    const [approvalType, setApprovalType] = useState('보고서');

    const user = useSelector((state: { auth: AuthState }) => state.auth.user);
    const accessToken = useSelector((state: { auth: AuthState }) => state.auth.accessToken);

    const editor = useEditor({
        extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), Underline, Image, Link, TableRow, TableCell, TableHeader],
        content: '',
    });

    // 임시저장
    useEffect(() => {
        if (approvalId && accessToken && editor) {
            const fetchDocumentForEdit = async () => {
                try {
                    const response = await axios.get(`http://localhost:8081/api/approvals/${approvalId}`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    
                    const docData = response.data.approval; 
                    setTitle(docData.approvalTitle);
                    editor.commands.setContent(docData.approvalDetail || '');
                    setApprovalType(docData.approvalType);

                   
                } catch (error) {
                    console.error("문서를 불러오는 데 실패했습니다.", error);
                    alert("문서 정보를 불러오지 못했습니다.");
                    navigate('/approvals/my-documents');
                }
            };
            fetchDocumentForEdit();
        }
    }, [approvalId, accessToken, editor, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setAttachedFile(e.target.files[0]);
    };

    const handleApproverConfirm = (picked: Member[]) => {
        setApprover(picked.map(m => m.userName).join(','));
        setApproverUserNo(picked.map(m => m.userNo));
        setInitialApprovers(picked);
        setIsApproverModalOpen(false);
    };

    const handleCcConfirm = (picked: Member[]) => {
        setCc(picked.map(m => m.userName).join(','));
        setCcUserNo(picked.map(m => m.userNo));
        setInitialCCs(picked);
        setIsCcModalOpen(false);
    };
    
    const handleSubmit = async (status: 'DRAFT' | 'SUBMIT') => {
        if (!user) {
      alert("사용자 정보가 없습니다.");
        return;
      }
      if (status === 'SUBMIT' && !title.trim()){
        alert("제목을 입력해주세요")
        return;
      }
      if (status === 'SUBMIT' && approverUserNo.length === 0) {
        alert("결재자를 선택해주세요.");
        return;
      }
      if (!accessToken) {
          alert("인증 토큰이 없습니다. 다시 로그인 해주세요.");
          return;
      }

        const formData = new FormData();

        const approvalData: any = {
            approvalTitle: title,
            approvalDetail: editor.getHTML(),
            userNo: user.userNo,
            userName: user.userName,
            approvalType: approvalType,
            approvalStatus: status === 'SUBMIT' ? 1 : 0,
            startDate: new Date().toISOString(),
            saveDate: new Date().toISOString(),
            approverUserNo: approverUserNo,
            ccUserNo: ccUserNo,
        };

        if (approvalId) {
        approvalData.approvalId = approvalId;
        }

        formData.append(
      'approvalData',
      new Blob([JSON.stringify(approvalData)], {type:'application/json'})
    );

    if (attachedFile) {
      formData.append('files', attachedFile);
    }

    try {
      const config = { headers: { "Authorization": `Bearer ${accessToken}` } };

      if (approvalId) {
        await axios.put(`http://localhost:8081/api/approvals/${approvalId}`, formData, config);
      } else {
        await axios.post("http://localhost:8081/api/approvals", formData, config);
      }

      alert(status === "SUBMIT" ? "상신 완료!" : "임시저장 완료!");
      navigate('/approvals/my-documents');

    } catch (err) {
      console.error(err);
      alert("문서 제출에 실패했습니다.");
    }
  };

    return (
        <div>
          <br />
            <div>
                <div className="topinput">
                    <label>작성일자</label>
                    <input type="text" readOnly value={new Date().toLocaleDateString()} />
                </div>
                <div className="topinput">
                    <label>제목</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="main33" />
                </div>
                <div className="topinput">
                    <label>문서 종류</label>
                    <select value={approvalType} onChange={(e) => setApprovalType(e.target.value)}>
                        <option value="보고서">보고서</option>
                        <option value="회의록">회의록</option>
                        <option value="휴가신청서">휴가신청서</option>
                        <option value="구매품의서">구매품의서</option>
                        <option value="지출결의서">지출결의서</option>
                        <option value="경비청구서">경비청구서</option>
                    </select>
                </div>
                <div className="topinput">
                    <label>결재자</label>
                    <input className="main34" type="button" value={approver} onClick={() => setIsApproverModalOpen(true)} readOnly />
                </div>
                <div className="topinput">
                    <label>참조자</label>
                    <input className="main34" type="button" value={cc} onClick={() => setIsCcModalOpen(true)} readOnly />
                </div>
            </div>
             <div className="btnbtn">
                <button className="topbtn" type="button" onClick={() => window.location.reload()}>초기화</button>
                <button className="topbtn" onClick={() => setIsApproverModalOpen(true)}>결재선</button>
                <input type="file" id="file-attach" onChange={handleFileChange} style={{ display: 'none' }} />
                <button className="topbtn" onClick={() => document.getElementById('file-attach')?.click()}>파일첨부</button>
                <button className="topbtn" type="button" onClick={() => handleSubmit("SUBMIT")}>상신</button>
                {attachedFile && <span>{attachedFile.name}</span>}
            </div>
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            <PeoplePickerDialog open={isApproverModalOpen} onClose={() => setIsApproverModalOpen(false)} onConfirm={handleApproverConfirm} initialSelected={initialApprovers} excludeUserNo={user?.userNo}/>
            <PeoplePickerDialog open={isCcModalOpen} onClose={() => setIsCcModalOpen(false)} onConfirm={handleCcConfirm} initialSelected={initialCCs} excludeUserNo={user?.userNo}/>
        </div>
    );
};

export default ApprovalForm;