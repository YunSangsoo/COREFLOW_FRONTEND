import React,{ useEffect, useState} from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import './Approval.css';

interface ApiDocument {
    approvalId: number;
    approvalType: string;
    approvalTitle: string;
    startDate: string;
    apporvalStatus: string;
}

interface Document {
    id: number;
    type: string;
    title: string;
    date: string;
    status: string;
}

const ReceivedDocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filter, setFilter] = useState<string>("일반결재");
    const [loading, setLoading] = useState(true);

    const accessToken = useSelector((state: any) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken){
            setLoading(false);
            return;
        }

        const fetchReceivedDocuments = async () =>{
            try{
                const response = await axios.get('http://localhost:8081/api/approvals/received-documents',{
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                const mappedDocs = response.data.map((item: ApiDocument) => ({
                    id: item.approvalId,
                    type: item.approvalType, 
                    title: item.approvalTitle,
                    date: item.startDate ? new Date(item.startDate).toLocaleDateString() : "",
                    status: "결재 대기"
                }));
                setDocuments(mappedDocs);
            } catch(err) {
                console.error("문서 가져오기 실패:", err);
        } finally{
            setLoading(false);
        }    
    };
    fetchReceivedDocuments();
    }, [accessToken]);

    if (loading) {
        return <div>로딩중...</div>;
    }

    const filteredDocs = documents.filter(doc => doc.type === filter);

    return(
        <div>
            <div className="arrbtn1">
                <button className="arrbtn" onClick={() => setFilter("일반결재")}>일반문서</button>
                <button className="arrbtn" onClick={() => setFilter("휴가원")}>휴가원</button>
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
                {filteredDocs.map(doc => (
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
                ))}
                </tbody>
            </table>
        </div>
        
    )
};

export default ReceivedDocumentTable;