import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import './Approval.css';
import Pagination from "./Pagination";


interface Document {
    id: number;
    title: string;
    drafter: string; 
    date: string;
    status: string;
}

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
    
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const accessToken = useSelector((state: any) => state.auth.accessToken);
    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        const fetchCcDocuments = async () => {
            try {
                const response = await axios.get('http://localhost:8081/api/approvals/cc-documents', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    params: {keyword:query}
                });

                const mappedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    title: item.approvalTitle,
                    drafter: item.userName || "정보 없음", 
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
    }, [accessToken, query]);

    const handleSearch = () => {
        setQuery(searchTerm.trim());
        setCurrentPage(1);
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter'){
            handleSearch();
        }
    }

    if (loading) return <div>로딩중...</div>;

    const indexOfLastDocument = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstDocument = indexOfLastDocument - ITEMS_PER_PAGE;
    const currentDocuments = documents.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);

    return (
        <div className="document-container"> 
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
                    {currentDocuments.length > 0 ? (
                        currentDocuments.map(doc => (
                            <tr key={doc.id}>
                                <td>
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
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                />

            <div className="scbar">
                <input type="text" 
                placeholder="검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}/>
                <button onClick={handleSearch}>검색</button>
            </div>
        </div>
    );
};

export default CcDocumentTable;