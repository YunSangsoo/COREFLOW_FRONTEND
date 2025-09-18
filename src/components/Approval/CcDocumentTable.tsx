import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import './Approval.css'; // 기존에 사용하던 CSS를 그대로 활용합니다.

// 표시할 문서 데이터의 타입을 정의합니다. '기안자'를 추가합니다.
interface Document {
    id: number;
    title: string;
    drafter: string; // 기안자 (누가 보냈는지)
    date: string;
    status: string;
}

// 문서 상태 코드(숫자)를 문자열로 변환하는 함수
const mapStatusToString = (status: number): string => {
    switch (status) {
        case 1: return '진행중';
        case 2: return '승인';
        case 3: return '반려';
        default: return '상태없음';
    }
};

const CcDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const accessToken = useSelector((state: any) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        const fetchCcDocuments = async () => {
            try {
                // ✅ API 호출 주소를 '/cc-documents'로 변경합니다.
                const response = await axios.get('http://localhost:8081/api/approvals/cc-documents', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                // API 응답 데이터를 화면에 맞게 가공(mapping)합니다.
                const mappedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    title: item.approvalTitle,
                    drafter: item.userName || "정보 없음", // 백엔드에서 보낸 userName을 drafter로 매핑
                    date: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
                    status: mapStatusToString(item.approvalStatus)
                }));

                setDocuments(mappedDocs);
            } catch (err) {
                console.error("참조 문서 가져오기 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCcDocuments();
    }, [accessToken]);

    if (loading) return <div>로딩중...</div>;

    return (
        <div className="document-container"> {/* CSS 클래스명을 적절히 맞춰주세요 */}
            <table>
                <thead>
                    <tr>
                        <th>제목</th>
                        <th>기안자</th>
                        <th>기안일</th>
                        <th>문서 상태</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.length > 0 ? (
                        documents.map(doc => (
                            <tr key={doc.id}>
                                <td>
                                    {/* 문서 제목을 클릭하면 상세 페이지로 이동합니다. */}
                                    <Link to={`/approvals/${doc.id}`}>{doc.title}</Link>
                                </td>
                                <td>{doc.drafter}</td>
                                <td>{doc.date}</td>
                                <td>{doc.status}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4}>참조된 문서가 없습니다.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CcDocumentTable;