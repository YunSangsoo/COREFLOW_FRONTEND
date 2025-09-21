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
    depId?:number;
    posId?:number;
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
}

export interface NotiDetail{
    notiId:number;
    essential:string;
    title:string;
    userName:string;
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
}