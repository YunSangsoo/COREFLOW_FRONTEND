export interface TreeNode{
    name:string;
    attributes?:{
        id:number;
        type:'compony'|'department'|'team'|'employee'
    };
    children?:TreeNode[];
}