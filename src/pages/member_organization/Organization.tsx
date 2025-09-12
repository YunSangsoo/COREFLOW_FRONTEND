import { useQuery } from "@tanstack/react-query"
import type { Department, DepartmentDetail } from "../../types/member"
import { depDetailList, depList } from "../../api/memberApi"
import { deptDetailList, deptList } from "../../api/organizationApi"
import { useState } from "react";

export default function Organization(){

    const [parentId, setParentId] = useState<number|null>(null);
    // 1. 부서 조회
    const { data: deptData } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: deptList
    }) 
    // 2. 부서별 팀 조회
    const { data: deptDetilData } = useQuery<DepartmentDetail[]>({
        queryKey: ['departmentDetails',parentId],
        queryFn: () => deptDetailList(parentId!),
        enabled:!!parentId
    })











    return(
        <div>얖얖</div>
    )
}