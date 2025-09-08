import React,{ useEffect, useState } from "react";

interface Doc {
    id: number;
    type: string;
    title: string;
    date: string;
}

function DocumentSave() {
    const [docs, setDocs] = useState<Doc[]>([]);

    useEffect(() => {
        fetch("/api/docs")
        .then((res) => {
            if(!res.ok) throw new Error("통신에러");
            return res.json();
        })
        .then((data) => setDocs(data))
        .catch((err) => console.error(err));
    },[]);


return (
    <div>
    <table>
        <thead>
            <tr>
                <th>구분</th>
                <th>제목</th>
                <th>수정날짜</th>
            </tr>
        </thead>
        <tbody>
            {docs.length > 0 ? (
                docs.map((doc) => (
                    <tr key={doc.id}>
                        <td>{doc.type}</td>
                        <td>{doc.title}</td>
                        <td>{doc.date}</td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={3}>문서가 없습니다.</td>
                </tr>
            )}
        </tbody>
    </table>
    </div>
    )
}

export default DocumentSave;