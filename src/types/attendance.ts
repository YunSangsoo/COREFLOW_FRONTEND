export interface Attendance{
    attId:number;
    attDate:string;
    userName:string;
    depName:string;
    posName:string;
    checkInTime:string|null;
    checkOutTime:string|null;
    vacName:string;
}

export interface PostCheckInTime{
    attDate:string;
    checkInTime:string|null;
    status:number;
}

export interface PutCheckOutTime{
    attId:number;
    checkOutTime:string|null;
}

export interface VacType{
    vacCode:number;
    vacName:string;
}

export interface VacTypeUpdate{
    attId:number;
    vacCode:number;
}