export interface VacationInfo{
    workLv:number;
    workPrd:number;
    vacAmount:number;
}

export interface MemberChoice{
    userNo:number;
    userName:string;
    depName:string;
    posName:string;
    hireDate:string;
}

export interface MemberVacation{
    userNo:number;
    vacName:string;
    vacStart:string;
    vacEnd:string;
    vacAmount:number;
    status:number;
}