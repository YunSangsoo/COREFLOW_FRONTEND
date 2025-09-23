import React from 'react';
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
        return null; 
    }

    return (
        <nav>
            <ul className="pagination">
                <li className={currentPage === 1 ? 'disabled' : ''}>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                        &laquo;
                    </button>
                </li>

                {pageNumbers.map(number => (
                    <li key={number} className={currentPage === number ? 'active' : ''}>
                        <button onClick={() => onPageChange(number)}>
                            {number}
                        </button>
                    </li>
                ))}

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