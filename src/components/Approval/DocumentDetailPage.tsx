import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";


interface Approval {
    approvalTitle: string;
    approvalType: string;
    startDate: string;
    endDate?: string;
    approvalStatus: number;
    approvalDetail: string;
    drafterName: string;
}

interface DocumentData{
    approval: Approval;
    currentUserIsApprover: boolean;
    
}

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (!accessToken || !id) {
            setLoading(false);
            // 토큰이 없으면 로그인 페이지로 이동하는 로직을 추가할 수 있습니다.
            return;
        }

        const fetchDocumentDetail = async () => {
            try {
                const response = await axios.get<DocumentData>(`http://localhost:8081/api/approvals/${id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setDoc(response.data);
            } catch (error) {
                console.error("문서 상세정보 로딩 실패:", error);
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

    if (loading) return <div>Loading...</div>;
    if (!doc) return <div>문서 정보를 찾을 수 없음</div>;

    const mapStatus = (status: number): string => {
        switch (status) {
            case 1: return '진행중';
            case 2: return '승인';
            case 3: return '반려';
            default: return '상태 미지정';
        }
    };


    return (
        <div>
            <h1>{doc.approval.approvalTitle}</h1>
            <p><strong>작성자:</strong> {doc.approval.drafterName}</p>
            <p><strong>문서 종류:</strong> {doc.approval.approvalType}</p>
            <p><strong>기안일:</strong> {new Date(doc.approval.startDate).toLocaleDateString()}</p>
            <p><strong>문서 상태:</strong> {mapStatus(doc.approval.approvalStatus)}</p>
            {(doc.approval.approvalStatus === 2 || doc.approval.approvalStatus === 3) && doc.approval.endDate && (
                <p><strong>완료일:</strong> {new Date(doc.approval.endDate).toLocaleDateString()}</p>
            )}
            <hr />
            <div dangerouslySetInnerHTML={{ __html: doc.approval.approvalDetail }} />
            <hr />

            {/* 현재 사용자가 결재자일 경우에만 이 버튼들이 보임 */}
            {doc.currentUserIsApprover && doc.approval.approvalStatus === 1 && (
                <div>
                    <button onClick={() => handleApprovalAction('APPROVE')} style={{ marginRight: '10px' }}>승인</button>
                    <button onClick={() => handleApprovalAction('REJECT')}>반려</button>
                </div>
            )}
        </div>
    );
};

export default DocumentDetailPage;