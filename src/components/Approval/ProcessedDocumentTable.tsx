import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import  Pagination  from './Pagination';
import './Processed.css';

const ProcessedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');

    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const documentsPerPage = 10;

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!accessToken) return;
            try {
                const response = await axios.get('http://localhost:8081/api/approvals/processed-documents', {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    params:{keyword:query}
                });
                setDocuments(response.data);
            } catch (error) {
                console.error("결재 완료 문서를 불러오는 데 실패했습니다:", error);
            }
        };
        fetchDocuments();
    }, [accessToken, query]);

    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = documents.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(documents.length / documentsPerPage);

    const getStatusText = (status: string) => {
        if (status === 'APPROVED') return '승인';
        if (status === 'REJECTED') return '반려';
        return status;
    };

    const handleSearch = () => {
        setQuery(searchTerm.trim());
        setCurrentPage(1);
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter'){
            handleSearch();
        }
    }

    return (
        
        <div>
            <br />
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
            <div className='scbar'>
                <input type="text" 
                    placeholder='검색'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyPress}/>
                    <button onClick={handleSearch}>검색</button>
            </div>
        </div>
    );
};

export default ProcessedDocumentTable;