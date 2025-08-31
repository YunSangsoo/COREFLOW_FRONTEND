// 부서 조회
export interface Department{
    depId : number;
    depName : string;
}

// 직위 조회
export interface Position{
    posId : number;
    posName : string;
}

// 검색조건
export interface SearchParams{
    userName : string|null;
    depName : string|null;
    posName : string|null;
}

// 사원 조회
export interface MemberResponse{
    userNo : number;
    userName: string;
    email : string;
    hireDate : string;
    depName : string;
    posName : string;
    phone : string;
}

// 사원 상세 조회
export interface MemberDetail{
    userNo : number;
    userName : string;
    email : string;
    phone : string;
    hireDate : string;
    depName : string;
    posName : string;
    extention : number;
    updateDate : string;
    address : string;
    addressDetail : string;
}