import axios, { type AxiosResponse } from "axios";

const getToken = (): string | null => localStorage.getItem("accessToken");

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


export const getDocuments = async (): Promise<ApprovalDto[]> => {
    const token = getToken();

    if(!token){
        console.error("인증 토큰이 없습니다.");
        return [];
    }
    try {
        const response: AxiosResponse<ApprovalDto[]> = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/approvals/`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("문서 목록을 불러오는 데 실패했습니다:", error);
        return [];
    }
};

export const mapStatus = (status: number): "대기중" | "완료" | "반려" => {
    switch (status) {
        case 0: return "대기중";
        case 1: return "완료";
        case 2: return "반려";
        default: return "대기중";
    }
    
};