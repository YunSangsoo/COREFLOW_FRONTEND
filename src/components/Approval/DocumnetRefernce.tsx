import React,{  useMemo, useState } from "react";

interface Document {
    id: number;
    type: '일반'|'휴가원';
    title: string;
    name: string;
    date: string;
}

const documents: Document[] = [];

const ITEMS_PER_PAGE = 10;

interface DocumentTableProps {
    documents: Document[];
}

const DocumentTable: React.FC<DocumentTableProps> = ({ documents}) => {

    return (
    <table className="documnet-table">
        <thead>
            <tr>
                <th>구분</th>
                <th>제목</th>
                <th>작성자</th>
                <th>기안일</th>
            </tr>
        </thead>
        <tbody>
            {documents.length > 0 ? (
                documents.map((doc) => (
                    <tr key={doc.id}>
                    <td>{doc.type}</td>
                    <td>{doc.title}</td>
                    <td>{doc.name}</td>
                    <td>{doc.date}</td>
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={4}
                     style={{textAlign: 'center'}}
                    >표시할 문서가 없습니다.</td>
                </tr>
            )}
        </tbody>
    </table>
    );
};
interface PaginationProps {
    currentPage: number;
    totalPages:number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange}) => {
    if (totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: totalPages}, (_,i) => i +1);

    return (
        <div>
            {pageNumbers.map(pageNumber => (
                <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={currentPage === pageNumber ? 'active' : ''}
                >{pageNumber}</button>
            ))}
        </div>
    )
}

function DocumentPage() {
    const [activeTab, setActiveTab] = useState<'일반문서'|'휴가원'>('일반문서');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredDocuments = useMemo(() => {
    if (activeTab === '일반문서') {
      return documents.filter(doc => doc.type === '일반');
    }
    return documents.filter(doc => doc.type === '휴가원');
  }, [activeTab]);

  const currentDocumentes = filteredDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE);

const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

const handleTabClick = (tabName: '일반문서'|'휴가원') =>{
    setActiveTab(tabName);
    setCurrentPage(1);
};

return (
    <div className="approvalpage">
        <div>

        <button className={activeTab === '일반문서' ? 'active' : ''}
        onClick={() => handleTabClick('일반문서')}>
            일반문서
        </button>
        <button className={activeTab === '휴가원' ? 'active' : ''}
        onClick={() => handleTabClick('휴가원')}>
            휴가원
        </button>
        </div>
        <DocumentTable documents={currentDocumentes}/>
    <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        />
    </div>
)
}

export default DocumentPage;