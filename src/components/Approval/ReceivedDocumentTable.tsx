import React, { useEffect, useState} from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import './Approval.css'
import { Link } from "react-router-dom";
import Pagination from "./Pagination";

interface Document {
    id: number;
    type: string;
    title: string;
    drafter: string;
    date: string;
    status: string;
    
}

const mapStatusCodeToString = (statusCode: number): string => {
    switch (statusCode){
        case 1:
            return "진행중"
        case 2:
            return "완료"
        case 3:
            return "반려"
        default:
            return "진행중"
    }
}
const DOCUMENT_TYPES = ["전체", "보고서", "회의록", "휴가신청서", "구매품의서", "지출결의서", "경비청구서"];

const ReceivedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filter, setFilter] = useState<string>("전체");
    const [loading, setLoading] = useState(true);

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

        const fetchReceivedDocuments = async () => {
            setLoading(true);
            try{
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/approvals/received-documents`,{
                    headers: {
                        'Authorization':`Bearer ${accessToken}`
                    },
                    params: {keyword: query}
                });

                const mappedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    type: item.approvalType,
                    title: item.approvalTitle,
                    drafter: item.userName || "정보 없음",
                    date: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
                    status: mapStatusCodeToString(item.approvalStatus)
                }));
                setDocuments(mappedDocs);
            }catch(err){
                console.error("문서 가져오기 실패")
            } finally{
                setLoading(false);
            }
        };
        fetchReceivedDocuments();
    }, [accessToken, query]);
    
    const handleSearch = () => {
        setQuery(searchTerm.trim());
        setCurrentPage(1);
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            handleSearch();
        }
    }
    
    const handleFilterClick = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    }
    if (loading) return <div>Loding...</div>;


    const docsToRender = query
      ? documents
      : filter === "전체"
        ? documents
        : documents.filter(doc => doc.type === filter);

    const indexOfLastDocument = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstDocument = indexOfLastDocument - ITEMS_PER_PAGE;
    const currentDocumentes = docsToRender.slice(indexOfFirstDocument, indexOfLastDocument);
    const totalPages = Math.ceil(docsToRender.length / ITEMS_PER_PAGE);

    const getStatusClassName = (status:string): string => {
        switch (status) {
            case "진행중":
                return 'status-waiting';
            case "완료":
                return 'status-completed';
            case "반려":
                return 'status-rejected';
            default:
                return '';
        }
    };

    return (
        <div className="approvalpage">
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
                        <th>기안자</th>
                        <th>기안일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                    <tbody>
                    {currentDocumentes.length > 0 ? (
                        currentDocumentes.map(doc => (
                            <tr key={doc.id}>
                                <td>{doc.type}</td>
                                <td>
                                    <Link to={`/approvals/${doc.id}`}>{doc.title}</Link>
                                </td>
                                <td>{doc.drafter}</td>
                                <td>{doc.date}</td>
                                <td>
                                    <span className={`status ${getStatusClassName(doc.status)}`}>
                                        {doc.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                        ) : (
                        <tr>
                            
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                수신된 문서가 없습니다.
                            </td>
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

export default ReceivedDocumentTable;
