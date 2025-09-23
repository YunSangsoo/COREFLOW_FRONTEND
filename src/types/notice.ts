import type { customFile } from "./type";

export interface NoticeResponse{
    notiId:number;
    userName:string;
    title:string;
    enrollDate:Date;
    essential:string;
    status:string;
}

export interface SearchParams{
    searchType?:'title'|'content'|'writer';
    keyword?:string;
}

export interface NotiInsert{
    title:string;
    content:string;
    essential:'F'|'T';
    endDate?:string|null;
    endTime?:string|null;
    depId?:number|null;
    parentDepId?:number|null;
    childDepId?:number|null;
    posId?:number|null;
    file?:customFile[];
}

export interface NotiDetail{
    notiId:number;
    essential:string;
    title:string;
    userName:string;
    writer:number;
    depName:string;
    posName:string;
    enrollDate:Date;
    updateDate?:Date|null;
    content:string;
    parentDepId?:number|null;
    childDepId?:number|null;
    posId?:number|null;
    endDate?:string|null;
    endTime?:string|null;
    file?:customFile[];
}

export interface NotiDelete{
    notiId:number;
}

