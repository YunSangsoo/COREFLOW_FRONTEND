import { useState, type ChangeEvent } from "react"
import styles from './MemberMain.module.css'
import { useQuery } from "@tanstack/react-query";
import type { Department, DepartmentDetail, MemberResponse, Position, SearchParams } from "../../types/member";
import { depDetailList, depList, memberList, posList } from "../../features/memberService";
import MemberDetail from "./MemberDetail";

export default function MemberMain() {
    
    // 사원 조회 및 검색용 훅
    const [searchValues, setSearchValues] = useState({
        userName : '',
        parentDepId : null as number | null,
        childDepId : null as number | null,
        posName : ''
    });
    
    const [searchParams, setSearchParams] = useState<SearchParams>({
        userName : '',
        depName : '',
        posName : ''
    });

    // 사원 상세 조회용 훅
    const [isModal, setIsModal] = useState(false);
    const [selectedUser,setSelectedUser] = useState<number|null>(null);

    // 사원 목록 조회용 훅
    const {data:members, isLoading, isError, error} = useQuery<MemberResponse[]>({
        queryKey : ['members',searchParams],
        queryFn : () => {
            const convertedParams = {
                userName : searchParams.userName || '',
                depName : searchParams.depName || '',
                posName : searchParams.posName || ''
            };
            return memberList(convertedParams)
        }
    })

    // 부모 부서 조회용 훅
    const {data:parentDep} = useQuery<Department[]>({
        queryKey : ['departments'],
        queryFn : depList
    })

    // 자식 부서 조회용 훅
    const {data:childDep} = useQuery<DepartmentDetail[]>({
        queryKey : ['departmentDetails', searchValues.parentDepId],
        queryFn : () => depDetailList(searchValues.parentDepId!),
        enabled : searchValues.parentDepId !== null
    })

    // 직위 목록 조회용 훅
    const {data:position} = useQuery<Position[]>({
        queryKey : ['positions'],
        queryFn : posList
    })

    const handleChange = (e:ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const {name,value} = e.target;
        
        if(name === 'parentDepId'){
            setSearchValues(prev => ({
                ...prev,
                parentDepId:value ? Number(value) : null,
                childDepId : null
            }));
        }else if(name === 'childDepId'){
            setSearchValues(prev => ({
                ...prev,
                childDepId:value ? Number(value) : null
            }));
        }else{
            setSearchValues(prev => ({
                ...prev,
                [name]:value
            }));
        }
    }

    // 검색 버튼
    const handleSearch = () => {
        let finalDepName = '';

        // 자식 부서가 선택되었으면 자식 부서 이름을 사용
        if (searchValues.childDepId) {
            const selectedChildDep = childDep?.find(dep => dep.depId === searchValues.childDepId);
            if (selectedChildDep) {
                finalDepName = selectedChildDep.depName;
            }
        } 
        // 자식 부서가 선택되지 않았고 부모 부서만 선택되었으면 부모 부서 이름을 사용
        else if (searchValues.parentDepId) {
            const selectedParentDep = parentDep?.find(dep => dep.depId === searchValues.parentDepId);
            if (selectedParentDep) {
                finalDepName = selectedParentDep.depName;
            }
        }
        
        setSearchParams({
            userName: searchValues.userName,
            depName: finalDepName,
            posName: searchValues.posName,
        });
    };

    // 초기화 버튼
    const handleReset = () => {
        setSearchValues({
            userName : '',
            parentDepId : null,
            childDepId : null,
            posName : ''
        })
        setSearchParams({
            userName : '',
            depName : '',
            posName : ''
        })
    }

    // 사원 상세 조회
    const handleDetailOpen = (userNo:number) => {
        setSelectedUser(userNo);
        setIsModal(true);
    }

    const handleDetailClose = () => {
        setSelectedUser(null);
        setIsModal(false);
    }

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>

    return (
        <div className={styles.container}>
            <h1>사원관리</h1>
            <div className={styles.searchSection}>
                <span>사원명
                    <input type="text" placeholder="사원명 검색" name="userName" value={searchValues.userName} onChange={handleChange} />
                </span>
                <span>부서
                    <select name="parentDepId" value={searchValues.parentDepId || ''} onChange={handleChange}>
                        <option value="">전체</option>
                        {parentDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </span>
                <span>상세 부서
                    <select name="childDepId" value={searchValues.childDepId || ''} onChange={handleChange} disabled={!searchValues.parentDepId}>
                        <option value="">전체</option>
                        {childDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </span>
                <span>직위
                    <select name="posName" value={searchValues.posName} onChange={handleChange}>
                        <option value="">전체</option>
                        {position?.map(pos => (
                            <option key={pos.posId} value={pos.posName}>
                                {pos.posName}
                            </option>
                        ))}
                    </select>
                </span>
            </div>
            <div className={styles.buttonSection}>
                <button onClick={handleReset}>초기화</button>
                <button onClick={handleSearch}>검색</button>
                <button>사원등록</button>
            </div>
            <div className={styles.tableSection}>
                <table>
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>사원번호</th>
                            <th>사원명</th>
                            <th>이메일</th>
                            <th>입사일</th>
                            <th>소속</th>
                            <th>직위</th>
                            <th>전화번호</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members && members.length > 0 ? (
                            members.map((member, index) => (
                                <tr key={member.userNo} onDoubleClick={() => handleDetailOpen(member.userNo)}>
                                    <td>{index + 1}</td>
                                    <td>{member.userNo}</td>
                                    <td>{member.userName}</td>
                                    <td>{member.email}</td>
                                    <td>{member.hireDate}</td>
                                    <td>{member.depName}</td>
                                    <td>{member.posName}</td>
                                    <td>{member.phone}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8}>-</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isModal && selectedUser !== null && (
                <MemberDetail userNo={selectedUser} onClose={handleDetailClose} />
            )}
        </div>
    );
}