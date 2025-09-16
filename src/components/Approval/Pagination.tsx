import React from 'react';
import './Pagination.css'; // 페이지네이션 전용 CSS 파일을 import합니다.
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    if (totalPages <= 1) {
        return null; // 페이지가 1개 이하면 페이지네이션을 표시하지 않음
    }

    return (
        <nav>
            <ul className="pagination">
                {/* 이전 페이지 버튼 */}
                <li className={currentPage === 1 ? 'disabled' : ''}>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                        &laquo;
                    </button>
                </li>

                {/* 페이지 번호 버튼 */}
                {pageNumbers.map(number => (
                    <li key={number} className={currentPage === number ? 'active' : ''}>
                        <button onClick={() => onPageChange(number)}>
                            {number}
                        </button>
                    </li>
                ))}

                {/* 다음 페이지 버튼 */}
                <li className={currentPage === totalPages ? 'disabled' : ''}>
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                        &raquo;
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;