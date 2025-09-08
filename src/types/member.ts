// 부모 부서 조회
export interface Department{
    depId : number;
    depName : string;
    parentId : null;
}

// 자식 부서 조회
export interface DepartmentDetail{
    depId : number;
    depName : string;
    parentId : number;
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
    status : string|null;
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
    status : string;
    updateDate : string;
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
    extension : string;
    updateDate : string;
    address : string;
    addressDetail : string;
    status : string;
}

// 사원 정보 수정
export interface MemberPatch{
    userName? : string;
    email? : string;
    phone? : string;
    hireDate? : string
    depName? : string;
    posName? : string;
    extension? : string;
    updateDate? : string;
    address? : string;
    addressDetail? : string;
    status? : string;
}

export interface MemberDelete{
    userNo : number;
}