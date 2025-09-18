import React, { useEffect, useState} from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import './Approval.css'
import { Link } from "react-router-dom";

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

        const fetchReceivedDocuments = async () => {
            try{
                const response = await axios.get('http://localhost:8081/api/approvals/received-documents',{
                    headers: {
                        'Authorization':`Bearer ${accessToken}`
                    }
                });

                const mappedDocs = response.data.map((item: any) => ({
                    id: item.approvalId,
                    type: item.approvalType,
                    title: item.approvalTitle,
                    drafter: item.drafterName || "정보 없음",
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
    }, [accessToken]);

    if (loading) return <div>Loding...</div>;

    const filteredDocs = documents.filter(doc => doc.type === filter);

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
        <div>
            <br />
            <div className="arrbtn1">
                <button className="arrbtn" onClick={() => setFilter("일반결재")}>일반문서</button>
                <button className="arrbtn" onClick={() => setFilter("휴가원")}>휴가원</button>
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
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map(doc => (
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
        </div>
    );
};

export default ReceivedDocumentTable;
