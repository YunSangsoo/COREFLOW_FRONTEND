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
    vacId:number;
    userNo:number;
    userName:string;
    vacName:string;
    vacStart:string;
    vacEnd:string;
    vacAmount:number;
    status:number;
}

export interface VacStatus{
    status:number;
}

export interface LoginUser{
    userNo:number;
    userName:string;
    depName:string;
    posName:string;
    hireDate:string;
}

export interface VacType{
    vacCode:number;
    vacName:string;
}

export interface PutVacation{
    vacCode:number;
    vacStart:string;
    vacEnd:string;
    vacAmount:number;
}