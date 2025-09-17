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