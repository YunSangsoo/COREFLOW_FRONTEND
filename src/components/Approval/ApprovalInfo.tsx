import React, {useState} from "react";

function ApprovalInfo() {
    const [writer, setWriter] = useState("");
    const [title, setTitle] = useState("");
    const [approver, setApprover] = useState("");
    const [referrer, setReferrer] = useState("");

    return (
        <div>
            <div>
                <input
                 type="text"
                 placeholder="작성일자"
                 value={writer}
                 onChange={(e) => setWriter(e.target.value)} />
            </div>
            <div>
                <input type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <input type="text"
                placeholder="결재자"
                value={approver}
                onChange={(e) => setApprover(e.target.value)} />
            </div>
            <div>
                <input type="text"
                placeholder="참조자"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)} />
            </div>
        </div>
    );
}
// 아직 미정
export default ApprovalInfo;