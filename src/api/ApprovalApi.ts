import axios from "axios";

export interface ApprovalDto {
    approvalId: number;
    userNo: number;
    approvalTitle: string;
    approvalDetail: string;
    approvalType: "일반" | "휴가원";
    approvalStatus: number;
    startDate: string;
    endDate?: string;
    saveDate?: string;
}

// JWT 토큰 localStorage에서 가져오기
const getToken = () => localStorage.getItem("token");

export const getDocuments = () => {
    const token = getToken();
    return axios.get<ApprovalDto[]>("http://localhost:8081/api/approvals/documents", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    .then(res => res.data);
};

export const mapStatus = (status: number): "대기중" | "완료" | "반려" => {
    switch (status) {
        case 0: return "대기중";
        case 1: return "완료";
        case 2: return "반려";
        default: return "대기중";
    }
};
