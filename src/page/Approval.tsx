import React from "react";
import ApprovalToolbar from "../components/Approval/ApprovalToolbar"
import DocumentTable from "../components/Approval/DocumentTable"

function Approval() {
    return (
        <div>
            <h1>전자결재</h1>
            {/* <ApprovalForm /> */}
            <hr />
            <ApprovalToolbar />
            <DocumentTable/>
        </div>
    )
}

export default Approval;