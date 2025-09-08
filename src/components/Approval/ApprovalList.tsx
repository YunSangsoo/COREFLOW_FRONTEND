import React, { useEffect, useState } from "react";
import './Approval.css'

interface Documnet {
    id: number;
    type: "일반"|"휴가원";
    title: string;
    date:string;
    status: "대기중"|"완료"|"반려";
}

interface Props {
    documents?: Documnet[];
}

const DocumentTable: React.FC = () => {
    const [documents, setDocuments] = useState<Documnet[]>([]);
    const [filter, setFilter] = useState<"일반" | "휴가원">("일반");

    useEffect(() => {
        fetch("/api/documents")
        .then(res => res.json())
        .then(data => {
            const mappedDocs:Documnet[] = data.map((item:any) => ({
                id: item.approvalId,
                type: item.approvalType,
                title: item.approvalTitle,
                date: item.startDate,
                status: item.approvalStatus === 0
                    ? "대기중"
                    : item.approvalStatus === 1
                    ? "완료"
                    : "반려"
            }));
            setDocuments(mappedDocs);
        })
        .catch(err => console.error(err));
    }, []);

    const filteredDocs = documents.filter(doc => doc.type === filter);

    return (
        <div>
            <div className="arrbtn1">
                <button className="arrbtn" onClick={() => setFilter("일반")}>일반문서</button>
                <button className="arrbtn" onClick={()=> setFilter("휴가원")}>휴가원</button>
            </div>
            <table>
                <thead>
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
                            <td>{doc.title}</td>
                            <td>{doc.date}</td>
                            <td>
                                <span>
                                    {doc.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default DocumentTable;





// import React, { useState } from "react";
// import './Approval.css'

// interface Document {
//   id: number;
//   type: "일반" | "휴가원";
//   title: string;
//   date: string;
//   status: "대기중" | "완료" | "반려";
// }

// const DocumentTable: React.FC = () => {
//   const [filter, setFilter] = useState<"일반" | "휴가원">("일반");

//   // ✅ 여기서 mock 데이터 정의
//   const documents: Document[] = [
//     { id: 1, type: "일반", title: "업무 보고서", date: "2025-09-01", status: "대기중" },
//     { id: 2, type: "휴가원", title: "연차 신청", date: "2025-09-02", status: "완료" },
//     { id: 3, type: "일반", title: "회의록", date: "2025-09-03", status: "반려" },
//   ];

//   const filteredDocs = documents.filter((doc) => doc.type === filter);

//   return (
//     <div>
//       <div className="arrbtn1">
//         <button className="arrbtn" onClick={() => setFilter("일반")}>일반문서</button>
//         <button className="arrbtn" onClick={() => setFilter("휴가원")}>휴가원</button>
//       </div>
//       <table border={1} cellPadding={5} style={{ marginTop: "10px" }}>
//         <thead>
//           <tr>
//             <th>구분</th>
//             <th>제목</th>
//             <th>기안일</th>
//             <th>상태</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredDocs.length === 0 ? (
//             <tr>
//               <td colSpan={4} style={{ textAlign: "center" }}>
//                 데이터가 없습니다
//               </td>
//             </tr>
//           ) : (
//             filteredDocs.map((doc) => (
//               <tr key={doc.id}>
//                 <td>{doc.type}</td>
//                 <td>{doc.title}</td>
//                 <td>{doc.date}</td>
//                 <td className={`status-${doc.status}`}>{doc.status}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default DocumentTable;
