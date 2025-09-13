// 부모 부서 조회
export interface Department{
    depId : number;
    depName : string;
}

// 자식 부서 조회
export interface DepartmentDetail{
    depId : number;
    depName : string;
    parentId : number;
}

export interface TreeNode{
    name:string;
    attributes?:{
        id:number;
        type:'회사'|'부서'|'상세부서'|'사원'
        posName?:string
    };
    children?:TreeNode[];
}