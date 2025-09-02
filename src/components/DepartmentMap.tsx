import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Department, DepartmentDetail } from "../types/member";
import { depDetailList, depList } from "../features/memberService";
import styles from './DepartmentMap.module.css'

interface DepartmentMapProps{
    departmentSelect : (depName:string) => void;
}

export default function DepartmentMap({departmentSelect}:DepartmentMapProps) {

    // 부서 id 저장용 훅
    const [parentDepInfo, setParentDepInfo] = useState<number | null>(null);

    // 부모 부서 조회용 훅
    const {data:parentDep} = useQuery<Department[]>({
        queryKey : ['departments'],
        queryFn : depList
    });

    // 자식 부서 조회용 훅
    const {data:childDep} = useQuery<DepartmentDetail[]>({
        queryKey : ['departmentDetails',parentDepInfo],
        queryFn : () => depDetailList(parentDepInfo!),
        enabled : parentDepInfo !== null
    });

    // 부모 부서 클릭시
    const handleParentClick = (depId:number) => {
        setParentDepInfo(prev => prev === depId ? null : depId);
    }

    // 자식 부서 클릭시
    const handleDepSelect = (depName:string) => {
        departmentSelect(depName);
    }

    return (
        <div className={styles.departmentMap}>
            {parentDep?.map(parent => (
                <div key={parent.depId}>
                    <div
                        className={`${styles.departmentItem} ${parentDepInfo === parent.depId ? styles.active : ''}`}
                        onClick={() => handleParentClick(parent.depId)}
                    >
                        {parent.depName} {parentDepInfo === parent.depId ? '▼' : '▶'}
                    </div>
                    {parentDepInfo === parent.depId && (
                        <div className={styles.childList}>
                            {childDep?.map(child => (
                                <div key={child.depId} className={styles.childItem} onClick={() => handleDepSelect(child.depName)}>
                                    - {child.depName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}   