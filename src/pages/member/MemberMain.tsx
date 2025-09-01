import { useState, type ChangeEvent } from "react"
import styles from './MemberMain.module.css'
import { useQuery } from "@tanstack/react-query";
import type { Department, MemberResponse, Position, SearchParams } from "../../types/member";
import { depList, memberList, posList } from "../../features/memberService";
import MemberDetail from "./MemberDetail";

export default function MemberMain() {
    /*
        사원 조회 및 검색용 훅
    */
    const [searchValues, setSearchValues] = useState({
        userName : '',
        depName : '',
        posName : ''
    });
    
    const [searchParams, setSearchParams] = useState<SearchParams>({
        userName : null,
        depName : null,
        posName : null
    });
    /*
        사원 상세 조회용 훅
    */
    const [isModal, setIsModal] = useState(false);
    const [selectedUser,setSelectedUser] = useState<number|null>(null);

    // 사원 목록 조회용 훅
    const {data:members, isLoading, isError, error} = useQuery<MemberResponse[]>({
        queryKey : ['members',searchParams],
        queryFn : () => memberList(searchParams)
    })

    // 부서 목록 조회용 훅
    const {data:department} = useQuery<Department[]>({
        queryKey : ['departments'],
        queryFn : depList
    })
    // 직위 목록 조회용 훅
    const {data:position} = useQuery<Position[]>({
        queryKey : ['positions'],
        queryFn : posList
    })

    const handleChange = (e:ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const {name,value} = e.target;
        setSearchValues(prev => ({...prev,[name]:value}))
    }

    // 검색 버튼
    const handleSearch = () => {
        setSearchParams(searchValues);
    }

    // 초기화 버튼
    const handleReset = () => {
        setSearchValues({
            userName : '',
            depName : '',
            posName : ''
        })
        setSearchParams({
            userName : null,
            depName : null,
            posName : null
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

    return(
        <div className={styles.container}>
            <h1>사원관리</h1>
            <div className={styles.searchSection}>
                <span>사원명
                    <input type="text" placeholder="사원명 검색" name="userName" value={searchValues.userName} onChange={handleChange}/>
                </span>
                <span>부서
                    <select name="depName" value={searchValues.depName} onChange={handleChange}>
                        <option value="">전체</option>
                        {
                            department && department.length > 0 ? 
                            (department.map((dep) => (
                                <option key={dep.depId} value={dep.depName}>
                                    {dep.depName}
                                </option>
                            ))) : 
                            (<option value=""></option>)
                        }
                    </select>
                </span>
                <span>직위
                    <select name="posName" value={searchValues.posName} onChange={handleChange}>
                        <option value="">전체</option>
                        {
                            position && position.length > 0 ? 
                            (position.map((pos) => (
                                <option key={pos.posId} value={pos.posName}>
                                    {pos.posName}
                                </option>
                            ))) : 
                            (<option value=""></option>)
                        }
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
                            <th>부서</th>
                            <th>직위</th>
                            <th>전화번호</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            members && members.length > 0 ? 
                            (members.map((member,index) => {
                                return(
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
                                )
                            })) : 
                            (
                                <tr>
                                    <td colSpan={8}>-</td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
                {isModal && selectedUser !== null && (
                    <MemberDetail userNo={selectedUser} onClose={handleDetailClose}/>
                )}
        </div>
    )
}

// import { useState, type ChangeEvent } from "react"
// import styles from './MemberMain.module.css'
// import { useQuery } from "@tanstack/react-query";
// import type { Department, MemberResponse, Position, SearchParams } from "../../types/member";
// import MemberDetail from "./MemberDetail";

// // 임시 데이터 (Mock Data) 생성
// const mockDepartments: Department[] = [
//     { depId: 1, depName: '영업팀' },
//     { depId: 2, depName: '개발팀' },
//     { depId: 3, depName: '인사팀' },
// ];

// const mockPositions: Position[] = [
//     { posId: 1, posName: '사원' },
//     { posId: 2, posName: '대리' },
//     { posId: 3, posName: '팀장' },
// ];

// const mockMembers: MemberResponse[] = [
//     { userNo: 1, userName: '김민준', email: 'kmj@test.com', hireDate: '2022-01-15', depName: '영업팀', posName: '사원', phone: '010-1234-5678' },
//     { userNo: 2, userName: '박서연', email: 'psy@test.com', hireDate: '2021-05-20', depName: '개발팀', posName: '대리', phone: '010-9876-5432' },
//     { userNo: 3, userName: '이도윤', email: 'ldy@test.com', hireDate: '2023-03-10', depName: '인사팀', posName: '사원', phone: '010-1111-2222' },
//     { userNo: 4, userName: '정수민', email: 'jsm@test.com', hireDate: '2020-08-01', depName: '영업팀', posName: '팀장', phone: '010-3333-4444' },
//     { userNo: 5, userName: '최은지', email: 'cej@test.com', hireDate: '2023-11-25', depName: '개발팀', posName: '사원', phone: '010-5555-6666' },
//     { userNo: 6, userName: '윤지훈', email: 'yjh@test.com', hireDate: '2022-09-05', depName: '영업팀', posName: '대리', phone: '010-7777-8888' },
// ];

// // 임시 API 호출 함수 (mocking)
// const mockMemberList = (searchParams: SearchParams) => {
//     return new Promise<MemberResponse[]>(resolve => {
//         setTimeout(() => {
//             const filteredMembers = mockMembers.filter(member => {
//                 const userNameMatch = !searchParams.userName || member.userName.includes(searchParams.userName);
//                 const depNameMatch = !searchParams.depName || searchParams.depName === '' || member.depName === searchParams.depName;
//                 const posNameMatch = !searchParams.posName || searchParams.posName === '' || member.posName === searchParams.posName;
//                 return userNameMatch && depNameMatch && posNameMatch;
//             });
//             resolve(filteredMembers);
//         }, 500);
//     });
// };

// const mockDepList = () => {
//     return new Promise<Department[]>(resolve => {
//         setTimeout(() => resolve(mockDepartments), 500);
//     });
// };

// const mockPosList = () => {
//     return new Promise<Position[]>(resolve => {
//         setTimeout(() => resolve(mockPositions), 500);
//     });
// };

// // ... 기존 API 호출 함수는 더 이상 사용하지 않음
// // import { depList, memberList, posList } from "../../features/memberService";

// export default function MemberMain() {
    
//     // ... (기존 useState 상태들) ...
//     const [searchValues, setSearchValues] = useState({
//         userName : '',
//         depName : '',
//         posName : ''
//     });
    
//     const [searchParams, setSearchParams] = useState<SearchParams>({
//         userName : null,
//         depName : null,
//         posName : null
//     });
    
//     // 사원 목록 조회 (이제 가상 데이터를 사용)
//     const {data:members, isLoading, isError, error} = useQuery<MemberResponse[]>({
//         queryKey : ['members',searchParams],
//         queryFn : () => mockMemberList(searchParams)
//     })

//     // 부서 목록 조회 (이제 가상 데이터를 사용)
//     const {data:department} = useQuery<Department[]>({
//         queryKey : ['departments'],
//         queryFn : mockDepList
//     })
//     // 직위 목록 조회 (이제 가상 데이터를 사용)
//     const {data:position} = useQuery<Position[]>({
//         queryKey : ['positions'],
//         queryFn : mockPosList
//     })

//     const handleChange = (e:ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
//         const {name,value} = e.target;
//         setSearchValues(prev => ({...prev,[name]:value}))
//     }

//     // 검색 버튼
//     const handleSearch = () => {
//         setSearchParams(searchValues);
//     }

//     // 초기화 버튼
//     const handleReset = () => {
//         setSearchValues({
//             userName : '',
//             depName : '',
//             posName : ''
//         });
//         setSearchParams({
//             userName : null,
//             depName : null,
//             posName : null
//         })
//     }

//     // if(isLoading) return <div>Loading...</div>
//     // if(isError) return <div>{error.message}</div>

//     // ... (사원 상세 조회 관련 상태와 핸들러) ...
//     const [isModal, setIsModal] = useState(false);
//     const [selectedUser,setSelectedUser] = useState<number|null>(null);

//     const handleDetailOpen = (userNo:number) => {
//         setSelectedUser(userNo);
//         setIsModal(true);
//     }

//     const handleDetailClose = () => {
//         setSelectedUser(null);
//         setIsModal(false);
//     }

//     return(
//         <div className={styles.container}>
//             <h1>사원관리</h1>
//             <div className={styles.searchSection}>
//                 <span>사원명
//                     <input 
//                         type="text" 
//                         placeholder="사원명 검색" 
//                         name="userName" 
//                         value={searchValues.userName} 
//                         onChange={handleChange}
//                     />
//                 </span>
//                 <span>부서
//                     <select 
//                         name="depName" 
//                         value={searchValues.depName} 
//                         onChange={handleChange}
//                     >
//                         <option value="">전체</option>
//                         {
//                             department && department.length > 0 ? 
//                             (department.map((dep) => (
//                                 <option key={dep.depId} value={dep.depName}>
//                                     {dep.depName}
//                                 </option>
//                             ))) : 
//                             (null)
//                         }
//                     </select>
//                 </span>
//                 <span>직위
//                     <select 
//                         name="posName" 
//                         value={searchValues.posName} 
//                         onChange={handleChange}
//                     >
//                         <option value="">전체</option>
//                         {
//                             position && position.length > 0 ? 
//                             (position.map((pos) => (
//                                 <option key={pos.posId} value={pos.posName}>
//                                     {pos.posName}
//                                 </option>
//                             ))) : 
//                             (null)
//                         }
//                     </select>
//                 </span>
//             </div>
//             <div className={styles.buttonSection}>
//                 <button onClick={handleReset}>초기화</button>
//                 <button onClick={handleSearch}>검색</button>
//                 <button>사원등록</button>
//             </div>
//             <div className={styles.tableSection}>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>NO</th>
//                             <th>사원번호</th>
//                             <th>사원명</th>
//                             <th>이메일</th>
//                             <th>입사일</th>
//                             <th>부서</th>
//                             <th>직위</th>
//                             <th>전화번호</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {
//                             members && members.length > 0 ? 
//                             (members.map((member,index) => {
//                                 return(
//                                     <tr key={member.userNo} onDoubleClick={() => handleDetailOpen(member.userNo)}>
//                                         <td>{index + 1}</td>
//                                         <td>{member.userNo}</td>
//                                         <td>{member.userName}</td>
//                                         <td>{member.email}</td>
//                                         <td>{member.hireDate}</td>
//                                         <td>{member.depName}</td>
//                                         <td>{member.posName}</td>
//                                         <td>{member.phone}</td>
//                                     </tr>
//                                 )
//                             })) : 
//                             (
//                                 <tr>
//                                     <td colSpan={8}>-</td>
//                                 </tr>
//                             )
//                         }
//                     </tbody>
//                 </table>
//             </div>
//             {isModal && selectedUser !== null && (
//                 <MemberDetail userNo={selectedUser} onClose={handleDetailClose}/>
//             )}
//         </div>
//     )
// }