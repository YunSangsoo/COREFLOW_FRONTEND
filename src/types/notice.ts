export interface NoticeResponse{
    notiId:number;
    userName:string;
    title:string;
    enrollDate:Date;
    essential:String;
    status:String;
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
}