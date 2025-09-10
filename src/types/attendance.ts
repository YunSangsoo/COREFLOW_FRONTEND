export interface Attendance{
    attDate:string;
    userName:string;
    depName:string;
    posName:string;
    checkInTime:string|null;
    checkOutTime:string|null;
    status:number;
}