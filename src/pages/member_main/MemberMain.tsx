import { useState, type ChangeEvent } from "react"
import { useQuery } from "@tanstack/react-query";
import type { Department, DepartmentDetail, MemberResponse, Position, SearchParams } from "../../types/member";
import { depDetailList, depList, memberList, posList } from "../../api/memberApi";
import MemberDetail from "../../components/member_main/MemberDetail";
import MemberCreate from "../../components/member_main/MemberCreate";
import Pagination from "../../components/Approval/Pagination";

export default function MemberMain() {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    // 사원 조회 및 검색용 훅
    const [searchValues, setSearchValues] = useState({
        userName: '',
        parentDepId: null as number | null,
        childDepId: null as number | null,
        posName: '',
        status: ''
    });

    const [searchParams, setSearchParams] = useState<SearchParams>({
        userName: '',
        depName: '',
        posName: '',
        status: '',
    });

    // 사원 상세 조회 모달용 훅
    const [isModal, setIsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    // 사원 생성 모달용 훅
    const [isCreateModal, setIsCreateModal] = useState(false);

    // 사원 목록 조회용 훅
    const { data: members, isLoading, isError, error } = useQuery<MemberResponse[]>({
        queryKey: ['members', searchParams],
        queryFn: () => {
            const convertedParams = {
                userName: searchParams.userName || '',
                depName: searchParams.depName || '',
                posName: searchParams.posName || '',
                status: searchParams.status || ''
            };
            return memberList(convertedParams)
        }
    })

    // 부모 부서 조회용 훅
    const { data: parentDep } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: depList
    })

    // 자식 부서 조회용 훅
    const { data: childDep } = useQuery<DepartmentDetail[]>({
        queryKey: ['departmentDetails', searchValues.parentDepId],
        queryFn: () => depDetailList(searchValues.parentDepId!),
        enabled: searchValues.parentDepId !== null
    })
    
    // 직위 목록 조회용 훅
    const { data: position } = useQuery<Position[]>({
        queryKey: ['positions'],
        queryFn: posList
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'parentDepId') {
            setSearchValues(prev => ({
                ...prev,
                parentDepId: value ? Number(value) : null,
                childDepId: null
            }));
        } else if (name === 'childDepId') {
            setSearchValues(prev => ({
                ...prev,
                childDepId: value ? Number(value) : null
            }));
        } else {
            setSearchValues(prev => ({
                ...prev,
                [name]: value
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
            status: searchValues.status
        });
        setCurrentPage(1);
    };

    // 초기화 버튼
    const handleReset = () => {
        setSearchValues({
            userName: '',
            parentDepId: null,
            childDepId: null,
            posName: '',
            status: ''
        })
        setSearchParams({
            userName: '',
            depName: '',
            posName: '',
            status: '',
        })
        setCurrentPage(1);
    }

    // 사원 상세 조회
    const handleDetailOpen = (userNo: number) => {
        setSelectedUser(userNo);
        setIsModal(true);
    }

    const handleDetailClose = () => {
        setSelectedUser(null);
        setIsModal(false);
    }

    const handleCreateOpen = () => setIsCreateModal(true);
    const handleCreateClose = () => setIsCreateModal(false);

    const indexOfLastMember = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstMember = indexOfLastMember - ITEMS_PER_PAGE;
    const currentMember = members?.slice(indexOfFirstMember, indexOfLastMember);
    const totalPages = members && Math.ceil(members.length / ITEMS_PER_PAGE) || 0;

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">휴가 관리</h1>

            <div className="flex flex-wrap items-center justify-center gap-5 p-6 mb-6 rounded-xl bg-gray-50 border border-gray-200 shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-700">사원명</span>
                    <input
                        type="text"
                        placeholder="사원명 검색"
                        name="userName"
                        value={searchValues.userName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-40"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-700">부서</span>
                    <select
                        name="parentDepId"
                        value={searchValues.parentDepId || ''}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
                    >
                        <option value="">전체</option>
                        {parentDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-700">상세 부서</span>
                    <select
                        name="childDepId"
                        value={searchValues.childDepId || ''}
                        onChange={handleChange}
                        disabled={!searchValues.parentDepId}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px] disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        <option value="">전체</option>
                        {childDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-700">직위</span>
                    <select
                        name="posName"
                        value={searchValues.posName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
                    >
                        <option value="">전체</option>
                        {position?.map(pos => (
                            <option key={pos.posId} value={pos.posName}>
                                {pos.posName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm whitespace-nowrap text-gray-700">재직상태</span>
                    <select
                        name="status"
                        value={searchValues.status}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[120px]"
                    >
                        <option value="">전체</option>
                        <option value="T">재직</option>
                        <option value="F">퇴직</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-3 mb-5">
                <button
                    onClick={handleReset}
                    className="py-2 px-6 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-md"
                >
                    초기화
                </button>
                <button
                    onClick={handleSearch}
                    className="py-2 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                    검색
                </button>
                <button
                    onClick={handleCreateOpen}
                    className="py-2 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                >
                    사원등록
                </button>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-5 p-6 mb-6 rounded-xl bg-gray-50 border border-gray-200 shadow-md">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-10">NO</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-20">사원번호</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-25">사원명</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-50">이메일</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-25">입사일</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-20">소속</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-20">직위</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-35">전화번호</th>
                            <th scope="col" className="px-3 py-3 font-bold whitespace-nowrap text-xs text-gray-700 uppercase tracking-wider w-20">재직상태</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentMember && currentMember?.length > 0 ? (
                            currentMember.map((member, index) => (
                                <tr key={member.userNo} onDoubleClick={() => handleDetailOpen(member.userNo)} className="hover:bg-gray-100 transition-colors cursor-pointer">
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{indexOfFirstMember + index + 1}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.userNo}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.userName}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.email}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.hireDate.split('T')[0]}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.depName}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.posName}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.phone}</td>
                                    <td className="px-3 py-4 whitespace-nowrap text-gray-700">{member.status === 'T' ? '재직' : '퇴직'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-3 py-4 whitespace-nowrap text-center text-gray-600">조회하려는 사원이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>

            {isModal && selectedUser !== null && (
                <MemberDetail userNo={selectedUser} onClose={handleDetailClose} />
            )}
            {isCreateModal && (
                <MemberCreate isOpen={isCreateModal} onClose={handleCreateClose} />
            )}
        </div>
    );
}