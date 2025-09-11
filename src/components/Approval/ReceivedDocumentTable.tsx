import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import './Approval.css'; 

interface Document {
    id: number;
    type: string;
    title: string;
    date: string;
    status: string;
}

const DOC_TYPES = {
    GENERAL: '일반결재',
    VACATION: '휴가원',
};

const ReceivedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filter, setFilter] = useState<string>(DOC_TYPES.GENERAL);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const accessToken = useSelector((state: any) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        const fetchReceivedDocuments = async () => {
            try {
                setError(null); 
                const response = await axios.get('http://localhost:8081/approvals/received-documents', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                const fetchedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    type: item.approvalType,
                    title: item.approvalTitle,
                    date: new Date(item.startDate).toLocaleDateString(),
                    status: item.approvalStatus || '결재 대기', 
                }));
                setDocuments(fetchedDocs);
            } catch (err) {
                console.error("문서 가져오기 실패:", err);
                setError("문서를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchReceivedDocuments();
    }, [accessToken]);

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => doc.type === filter);
    }, [documents, filter]);

    if (loading) {
        return <div>로딩중...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div>
            <div className="arrbtn1">
                <button
                    className={`arrbtn ${filter === DOC_TYPES.GENERAL ? 'active' : ''}`}
                    onClick={() => setFilter(DOC_TYPES.GENERAL)}>
                    일반문서
                </button>
                <button
                    className={`arrbtn ${filter === DOC_TYPES.VACATION ? 'active' : ''}`}
                    onClick={() => setFilter(DOC_TYPES.VACATION)}>
                    휴가원
                </button>
            </div>
            <table>
                <thead className="topbar">
                    <tr>
                        <th>구분</th>
                        <th>제목</th>
                        <th>기안일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map(doc => (
                            <tr key={doc.id}>
                                <td>{doc.type}</td>
                                <td>
                                    <Link to={`/document/${doc.id}`}>{doc.title}</Link>
                                </td>
                                <td>{doc.date}</td>
                                <td>
                                    <span className="status status-waiting">{doc.status}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center' }}>
                                표시할 문서가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReceivedDocumentTable;