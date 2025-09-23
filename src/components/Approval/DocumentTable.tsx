import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import './Approval.css'
import { Link } from "react-router-dom";
import Pagination from "./Pagination";

interface Document {
    id: number;
    type: string;
    title: string;
    date: string;
    status: string;
}

const DOCUMENT_TYPES = ["전체", "보고서", "회의록", "휴가신청서", "구매품의서", "지출결의서", "경비청구서"];

const DocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("전체");
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const accessToken = useSelector((state: any) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken){
            setLoading(false);
            return;
        }

        const fetchMyDocuments = async () =>{
            try{
                const response = await axios.get('http://localhost:8081/api/approvals/my-documents',{
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    params: {keyword:query}
                });
                const mappedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    type: item.approvalType, 
                    title: item.approvalTitle,
                    date: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
                    status: item.approvalStatus === 1 ? "진행중" : item.approvalStatus === 2 ? "승인" : "반려" 
                }));
                setDocuments(mappedDocs);
            } catch(err) {
                console.error("문서 가져오기 실패:", err);
        } finally{
            setLoading(false);
        }    
    };
    fetchMyDocuments();
    }, [accessToken, query]);

    const handleSearch = () => {
        setQuery(searchTerm.trim());
        setCurrentPage(1);
    }

    const handleFilterClick = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter'){
            handleSearch();
        }
    }

    if (loading) return <div>로딩중...</div>;

     const docsToRender = query
      ? documents
      : filter === "전체"
        ? documents
        : documents.filter(doc => doc.type === filter);

    const indexOfLastDocument = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstDocument = indexOfLastDocument - ITEMS_PER_PAGE;
    const currentDocuments = docsToRender.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(docsToRender.length / ITEMS_PER_PAGE);

    const getStatusClassName = (status: string): string => {
    switch (status) {
        case "대기중": 
            return 'status-waiting';
        case "승인":
            return 'status-completed';
        case "반려":
            return 'status-rejected';
        default:
            return '대기중'; 
    }
};

    return (
        <div>
            <br />
            <div className="arrbtn1">
                {DOCUMENT_TYPES.map(type => (
                <button key={type} className={`arrbtn ${filter === type ? 'active' : ''}`}
                onClick={() => handleFilterClick(type)}>{type}</button>
                ))}
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
                    {currentDocuments.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.type}</td>
                            <td>
                              <Link to={`/approvals/${doc.id}`}>{doc.title}</Link>
                            </td>
                            <td>{doc.date}</td>
                            <td>
                            <span className={`status ${getStatusClassName(doc.status)}`}>{doc.status}</span>
                            </td>
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

export default DocumentTable;
