export interface Attendance{
    attId:number;
    attDate:string;
    userName:string;
    depName:string;
    posName:string;
    checkInTime:string|null;
    checkOutTime:string|null;
    status:number;
}

export interface PutCheckInTime{
    attDate:string;
    userNo:number;
    checkInTime:string|null;
    status:number;
}

export interface PutCheckOutTime{
    attId:number;
    checkOutTime:string|null;
}