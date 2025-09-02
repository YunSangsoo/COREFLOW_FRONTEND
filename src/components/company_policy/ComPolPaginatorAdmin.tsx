import { useState } from "react";
import type { CompanyPolicy } from "../../types/companyPolicy";

export default function ComPolPaginatorAdmin({policyList}:{policyList:CompanyPolicy[]}) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = policyList.slice(startIndex, endIndex);
    const totalPages = Math.ceil(policyList.length / itemsPerPage);

    // 이전 페이지로
    const goToPrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };
    // 다음 페이지로
    const goToNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };
    const handleLiClick = (policyNo:number) => {
        location.href = `/admin/cpolicies/${policyNo}`;
    };


    return (
        <>
            <button type="button" onClick={goToPrevious} disabled={currentPage === 1}>{"<이전"}</button>
            <ol style={{"display":"flex", "justifyContent":"space-evenly", "padding":0, "margin":0, "listStyle":"none"}}>
                {
                    currentItems && currentItems.map((policy, index) => (
                    <li key={policy.policyId} style={{"margin":"5px", "cursor":"pointer"}} onClick={() => handleLiClick(startIndex + index + 1)}>{startIndex + index + 1}</li>
                ))
                }
            </ol>
            <button type="button" onClick={goToNext} disabled={currentPage === totalPages}>{"다음>"}</button>

            <div>
                페이지 {currentPage} / {totalPages}
            </div>
        </>
    )
}