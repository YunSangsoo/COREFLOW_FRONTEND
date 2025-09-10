import React,{useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

const DocumentDetailPage: React.FC = () => {
    const {id} = useParams<{id:string}>();
    const [doc, setDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const accessToken = useSelector((state: any) => state.auth.accessToken);

    useEffect(() => {
        if (!accessToken || !id) return;

        const fetchMyDocument = async () => {
            try {
                const response = await axios.get(`http://localhost:8081/api/approvals/${id}`,{
                    headers: {'Authorization': `Bearer ${accessToken}`}
                });
                setDoc(response.data);
            } catch(error){
                console.error("문서 상세정보 로딩 실패:",error);
            }finally{
                setLoading(false);
            }
        };
        fetchMyDocument();
    },[id, accessToken]);

    if(loading) return <div>Loding...</div>;
    if(!doc) return <div>문서정보를 찾을수 없음</div>;

    const mapStatus = (status: number): string => {
        switch (status){
            case 0: return '임시저장';
            case 1: return '진행중';
            case 2: return '완료';
            case 3: return '반려';
            default: return '진행중';
        }
    };

    return(
        <div>
            <h1>{doc.approvalTitle}</h1>
            <p><strong>문서 종류:</strong>{doc.approvalType}</p>
            <p><strong>기안일:</strong>{new Date(doc.startDate).toLocaleDateString()}</p>
            <p><strong>문서 상태:</strong>{mapStatus(doc.approvalStatus)}</p>
            {(doc.approvalStatus === 2 || doc.approvalStatus === 3) && doc.endDate &&(
                <p><strong>완료일:</strong>{new Date(doc.endDate).toLocaleTimeString()}</p>
            )}
            <hr />
            <div dangerouslySetInnerHTML={{__html: doc.approvalDetail}}/>
        </div>
    );
};

export default DocumentDetailPage;


