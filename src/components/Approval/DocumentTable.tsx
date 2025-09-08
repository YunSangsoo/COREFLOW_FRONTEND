import React, { useEffect, useState } from "react";
import { getDocuments, mapStatus } from "../../api/ApprovalApi";
import './Approval.css'

interface Document {
    id: number;
    type: "일반" | "휴가원";
    title: string;
    date: string;
    status: "대기중" | "완료" | "반려";
}

const DocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filter, setFilter] = useState<"일반" | "휴가원">("일반");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocuments()
            .then(data => {
                const mappedDocs = data.map(item => ({
                    id: item.approvalId,
                    type: item.approvalType,
                    title: item.approvalTitle,
                    date: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
                    status: mapStatus(item.approvalStatus ?? 0),
                }));
                setDocuments(mappedDocs);
                setLoading(false);
            })
            .catch(err => {
                console.error("문서 가져오기 실패:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>로딩중...</div>;

    const filteredDocs = documents.filter(doc => doc.type === filter);

    return (
        <div>
            <div className="arrbtn1">
                <button className="arrbtn" onClick={() => setFilter("일반")}>일반문서</button>
                <button className="arrbtn" onClick={() => setFilter("휴가원")}>휴가원</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>제목</th>
                        <th>기안일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDocs.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.type}</td>
                            <td>{doc.title}</td>
                            <td>{doc.date}</td>
                            <td>{doc.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DocumentTable;
