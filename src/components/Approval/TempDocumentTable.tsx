import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Pagination from './Pagination';

const TempDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const [currentPage, setCurrentPage] = useState(1);
    const documentsPerPage = 10;

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!accessToken) return;
            try {
                // 새로 만든 임시저장함 API를 호출합니다.
                const response = await axios.get('http://localhost:8081/api/approvals/temp-documents', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setDocuments(response.data);
            } catch (error) {
                console.error("임시저장 문서를 불러오는 데 실패했습니다:", error);
            }
        };
        fetchDocuments();
    }, [accessToken]);

    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = documents.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(documents.length / documentsPerPage);

    return (
        <div>
            <h2>임시저장함</h2>
            <table>
                <thead>
                    <tr>
                        <th>문서 종류</th>
                        <th>제목</th>
                        <th>임시저장일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {currentDocuments.map(doc => (
                        <tr key={doc.approvalId}>
                            <td>{doc.approvalType}</td>
                            <td>
                                {/* 상세 페이지가 아닌 수정 페이지(ApprovalForm)로 연결합니다. */}
                                <Link to={`/approvals/edit/${doc.approvalId}`}>{doc.approvalTitle}</Link>
                            </td>
                            <td>{new Date(doc.saveDate).toLocaleDateString()}</td>
                            <td>임시저장</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default TempDocumentTable;