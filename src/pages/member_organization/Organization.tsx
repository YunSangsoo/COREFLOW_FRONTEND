import { useQuery } from "@tanstack/react-query"
import type { MemberResponse } from "../../types/member"
import { childDeptList, memberList, parentDeptList} from "../../api/organizationApi"
import { useState } from "react";
import type { Department, DepartmentDetail, TreeNode } from "../../types/organization";
import Tree from 'react-d3-tree'

export default function Organization() {
    const [parentDeptId, setParentDeptId] = useState<number | null>(null);
    const [childDeptId, setChildDeptId] = useState<number | null>(null);

    // 1. 부서 조회
    const { data: parentDepts} = useQuery<Department[]>({
        queryKey: ['parentDepts'],
        queryFn: parentDeptList
    })
    // 2. 부서별 팀 조회
    const { data: childDepts} = useQuery<DepartmentDetail[]>({
        queryKey: ['childDepts', parentDeptId],
        queryFn: () => childDeptList(parentDeptId!),
        enabled: !!parentDeptId
    })

    // 3. 팀별 사원 조회
    const { data: members }= useQuery<MemberResponse[]>({
        queryKey: ['members', childDeptId],
        queryFn: () => memberList(childDeptId!),
        enabled: !!childDeptId
    })

    const onNodeClick = (nodeData: any) => {
        const clickedId = nodeData.data.attributes?.id;
        const clickedType = nodeData.data.attributes?.type;

        if (!clickedId) return;

        if (clickedType === '부서') {
            setParentDeptId(clickedId === parentDeptId ? null : clickedId);
            setChildDeptId(null);
        } else if (clickedType === '상세부서') {
            setChildDeptId(clickedId === childDeptId ? null : clickedId);
        }
    }

    const transformDataToTree = (): TreeNode => {
        if (!parentDepts) {
            return { name: "데이터 없음", attributes: {id:0, type: "회사" }, children: [] };
        }

        const departmentNodes:TreeNode[] = parentDepts.map(parentDept => {
            const childrenNodes: TreeNode[] = (childDepts || [])
                .filter(child => child.parentId === parentDept.depId)
                .map(childDept => {
                    const memberNodes: TreeNode[] = (members && childDept.depId === childDeptId) ?
                        members.map(member => ({
                            name: member.userName,
                            attributes: {
                                id:member.userNo,
                                type: '사원',
                                posName: member.posName,
                            },
                            children: []
                        })) : [];

                    return {
                        name: childDept.depName,
                        attributes: {
                            id:childDept.depId,
                            type: '상세부서',
                        },
                        children: memberNodes
                    }
                })
            
            return {
                name: parentDept.depName,
                attributes: {
                    id:parentDept.depId,
                    type: '부서',
                },
                children: childrenNodes
            }
        })

        const companyRootNode:TreeNode={
            name:"KH정보교육원",
            attributes:{
                id:0,
                type:"회사"
            },
            children:departmentNodes
        }
        
        return companyRootNode;
    }
    const treeData: TreeNode = transformDataToTree();

    return(
        <div id="treeWrapper" style={{ width: '100vw', height: '100vh' }}>
            <Tree data={treeData} translate={{ x: 300, y: 100 }} orientation="vertical" onNodeClick={onNodeClick}/>
        </div>
    )
}