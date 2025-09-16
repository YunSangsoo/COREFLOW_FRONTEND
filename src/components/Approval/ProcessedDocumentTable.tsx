import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import  Pagination  from './Pagination';

const ProcessedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const [currentPage, setCurrentPage] = useState(1);
    const documentsPerPage = 10;

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!accessToken) return;
            try {
                // 새로 만든 API('/processed-documents')를 호출합니다.
                const response = await axios.get('http://localhost:8081/api/approvals/processed-documents', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setDocuments(response.data);
            } catch (error) {
                console.error("결재 완료 문서를 불러오는 데 실패했습니다:", error);
            }
        };
        fetchDocuments();
    }, [accessToken]);

    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = documents.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(documents.length / documentsPerPage);

    const getStatusText = (status: string) => {
        if (status === 'APPROVED') return '승인';
        if (status === 'REJECTED') return '반려';
        return status;
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>문서 종류</th>
                        <th>제목</th>
                        <th>기안일</th>
                        <th>내 결재 상태</th>
                    </tr>
                </thead>
                <tbody>
                    {currentDocuments.map(doc => (
                        <tr key={doc.approvalId}>
                            <td>{doc.approvalType}</td>
                            <td>
                                <Link to={`/approvals/${doc.approvalId}`}>{doc.approvalTitle}</Link>
                            </td>
                            <td>{new Date(doc.startDate).toLocaleDateString()}</td>
                            <td>{getStatusText(doc.processedStatus)}</td>
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

export default ProcessedDocumentTable;