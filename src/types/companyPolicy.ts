export interface CompanyPolicy {
    policyId: number;
    title: string;
    content: string;
    creatorUserNo: number;
    createdAt: Date;
    modUserNo?: number;
    lastModifiedAt?: Date;
}

export interface CompanyPolicyModHistory {
    modHistoryId: number;
    policyId: number;
    userNo: number;
    modifiedAt: Date;
    modContent: string;
}