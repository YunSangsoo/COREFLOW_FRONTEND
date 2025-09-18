import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import './Detail.css';
import { FiDownload, FiPaperclip } from 'react-icons/fi';

interface AttachedFile{
    id: number;
    fileName: string;
}

interface ApprovalLine{
    userName: string;
    lineStatus: string;
    lineOrder: number;
}

interface Approval {
    approvalTitle: string;
    approvalType: string;
    startDate: string;
    endDate?: string;
    approvalStatus: number;
    approvalDetail: string;
    userName: string;
    lines: ApprovalLine[];
    attachedFiles?: AttachedFile[];
}

interface DocumentData{
    approval: Approval;
    currentUserIsApprover: boolean;
    
}

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (!accessToken || !id) {
            setLoading(false);
            return;
        }

        const fetchDocumentDetail = async () => {
            try {
                const response = await axios.get<DocumentData>(`http://localhost:8081/api/approvals/${id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
            console.log("서버로부터 받은 데이터:", response.data); 
                setDoc(response.data);
            } catch (error) {
                console.error("문서 상세정보 로딩 실패:", error);
                setError("문서정보 불러오기 실패");
            } finally {
                setLoading(false);
            }
        };
        fetchDocumentDetail();
    }, [id, accessToken]);

    // 결재 처리 함수
    const handleApprovalAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!accessToken) {
            alert('로그인 정보가 없습니다.');
            return;
        }
        if (!window.confirm(action === 'APPROVE' ? '결재를 승인하시겠습니까?' : '결재를 반려하시겠습니까?')) {
            return;
        }
        try {
            await axios.post(
                `http://localhost:8081/api/approvals/${id}/process`,
                { action },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            alert('처리가 완료되었습니다.');
            
            window.location.href = '/approvals/my-documents';

        } catch (error) {
            console.error("결재 처리 실패:", error);
            alert('결재 처리에 실패했습니다.');
        }
    };
    
    const mapStatus = (status: number): string => {
        switch (status) {
            case 1: return '진행중';
            case 2: return '승인';
            case 3: return '반려';
            default: return '상태 미지정';
        }
    };

    const mapLineStatus = (status: string) => {
        switch (status) {
            case 'WAITING': return '대기';
            case 'APPROVED': return '승인';
            case 'REJECTED': return '반려';
            case 'PENDING': return '참조';
            default: return status;
        }
    }
    
        if (loading) return <div>Loading...</div>;
        if (error) return <div className="error-container">{error}</div>;
        if (!doc) return <div>문서 정보를 찾을 수 없음</div>;
    
    const approvers = doc.approval.lines.filter(line => line.lineOrder === 1);
    const ccs = doc.approval.lines.filter(line => line.lineOrder === 2);

    return (
        <div className="detail-page-container">
            <div className="detailbox">
                <div className="header-section">
                    <h1 className="title">{doc.approval.approvalTitle}</h1>
                    <div className="meta-info-grid">
                        <p className="headpont"><strong>작성자:</strong> {doc.approval.userName}</p>
                        <p className="headpont"><strong>문서 종류:</strong> {doc.approval.approvalType}</p>
                        <p className="headpont"><strong>기안일:</strong> {new Date(doc.approval.startDate).toLocaleDateString()}</p>
                        <p className="headpont"><strong>문서 상태:</strong> {mapStatus(doc.approval.approvalStatus)}</p>
                        {doc.approval.endDate && (
                            <p className="headpont"><strong>완료일:</strong> {new Date(doc.approval.endDate).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>

                <div className="detailbody" dangerouslySetInnerHTML={{ __html: doc.approval.approvalDetail }} />

                 <div className="attachment-section">
                    <h3>
                        <FiPaperclip /> 첨부파일
                        <span>({doc.approval.attachedFiles?.length || 0}개)</span>
                    </h3>
                    {doc.approval.attachedFiles && doc.approval.attachedFiles.length > 0 ? (
                        <ul className="attachment-list">
                            {doc.approval.attachedFiles.map(file => (
                                <li key={file.id}>
                                    <span>{file.fileName}</span>
                                    <a
                                        href={`http://localhost:8081/api/files/download/${file.id}`}
                                        download={file.fileName}
                                        className="download-button"
                                    >
                                        <FiDownload /> 다운로드
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-attachments">첨부된 파일이 없습니다.</p>
                    )}
                </div>

                <div className="approval-lines-section">
                    {approvers.length > 0 && (
                        <div>
                            <h3 className="line-title">결재자</h3>
                            <div className="member-tags">
                                {approvers.map((approver, index) => (
                                    <span key={index} className={`member-tag status-${approver.lineStatus.toLowerCase()}`}>
                                        {approver.userName} ({mapLineStatus(approver.lineStatus)})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {ccs.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <h3 className="line-title">참조자</h3>
                            <div className="member-tags">
                                {ccs.map((cc, index) => (
                                    <span key={index} className="member-tag status-pending">
                                        {cc.userName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {doc.currentUserIsApprover && doc.approval.approvalStatus === 1 && (
                    <div className="approvalbtn">
                        <button onClick={() => handleApprovalAction('APPROVE')} className="approve-button">승인</button>
                        <button onClick={() => handleApprovalAction('REJECT')} className="reject-button">반려</button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default DocumentDetailPage;