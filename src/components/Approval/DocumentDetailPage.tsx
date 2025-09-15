import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // useNavigate 추가
import { useSelector } from "react-redux";
import axios from "axios";

// 백엔드에서 받을 데이터 타입에 currentUserIsApprover 추가
interface DocumentDetail {
    approvalTitle: string;
    approvalType: string;
    startDate: string;
    endDate?: string;
    approvalStatus: number;
    approvalDetail: string;
    currentUserIsApprover: boolean; // 이 필드가 핵심!
}

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const navigate = useNavigate(); // 페이지 이동을 위한 hook

    useEffect(() => {
        if (!accessToken || !id) return;

        const fetchDocumentDetail = async () => {
            try {
                const response = await axios.get<DocumentDetail>(`http://localhost:8081/api/approvals/${id}`, {
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
            navigate('/approvals/received'); // 받은 문서함으로 이동
        } catch (error) {
            console.error("결재 처리 실패:", error);
            alert('결재 처리에 실패했습니다.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!doc) return <div>문서 정보를 찾을 수 없음</div>;

    const mapStatus = (status: number): string => {
        // ... (상태 매핑 함수는 동일)
        switch (status) {
            case 1: return '진행중';
            case 2: return '완료';
            case 3: return '반려';
            default: return '상태 미지정';
        }
    };

    return (
        <div>
            <h1>{doc.approvalTitle}</h1>
            <p><strong>문서 종류:</strong> {doc.approvalType}</p>
            <p><strong>기안일:</strong> {new Date(doc.startDate).toLocaleDateString()}</p>
            <p><strong>문서 상태:</strong> {mapStatus(doc.approvalStatus)}</p>
            {(doc.approvalStatus === 2 || doc.approvalStatus === 3) && doc.endDate && (
                <p><strong>완료일:</strong> {new Date(doc.endDate).toLocaleDateString()}</p>
            )}
            <hr />
            <div dangerouslySetInnerHTML={{ __html: doc.approvalDetail }} />
            <hr />

            {/* 현재 사용자가 결재자일 경우에만 이 버튼들이 보임 */}
            {doc.currentUserIsApprover && doc.approvalStatus === 1 && (
                <div>
                    <button onClick={() => handleApprovalAction('APPROVE')} style={{ marginRight: '10px' }}>승인</button>
                    <button onClick={() => handleApprovalAction('REJECT')}>반려</button>
                </div>
            )}
        </div>
    );
};

export default DocumentDetailPage;