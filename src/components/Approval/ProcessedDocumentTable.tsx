import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import  Pagination  from './Pagination';
import './Processed.css';

const DOCUMENT_TYPES = ["전체", "보고서", "회의록", "휴가신청서", "구매품의서", "지출결의서", "경비청구서"];

const ProcessedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');

    const [filter, setFilter] = useState<String>('전체');

    const accessToken = useSelector((state: any) => state.auth.accessToken);
    const documentsPerPage = 10;

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!accessToken) return;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/approvals/processed-documents`, {
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

    const docsToRender = query
        ? documents
        : filter === "전체"
          ? documents
          : documents.filter(doc => doc.approvalType === filter);

    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = docsToRender.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(docsToRender.length / documentsPerPage);

    const getStatusText = (status: string) => {
        if (status === 'APPROVED') return '승인';
        if (status === 'REJECTED') return '반려';
        return status;
    };

    const handleFilterClick = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    }

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
        <div className="approvalpage">
            <br />
            <div className="arrbtn1">
                {DOCUMENT_TYPES.map(type => (
                    <button
                        key={type}
                        className={`arrbtn ${filter === type ? 'active' : ''}`}
                        onClick={() => handleFilterClick(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>구분</th>
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
            <div className="scbar">
                <input className="search-input" type="text"
                placeholder="검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress} />
                <button className="search-button" onClick={handleSearch}>검색</button>
            </div>
        </div>
    );
};

export default ProcessedDocumentTable;