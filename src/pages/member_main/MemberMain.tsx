import { useState, type ChangeEvent } from "react"
import { useQuery } from "@tanstack/react-query";
import type { Department, DepartmentDetail, MemberResponse, Position, SearchParams } from "../../types/member";
import { depDetailList, depList, memberList, posList } from "../../api/memberApi";
import MemberDetail from "../../components/member_main/MemberDetail";
import type { User } from "../../types/type";

export default function MemberMain() {

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

    // 사원 계정 생성용 훅
    const [createUser, setCreateUser] = useState<User>({
        userNo: 0,
        email: '',             // string
        userName: '',          // string
        depId: 0,
        posId: 0,
        profile: '',
        roles: [],             // string[]
        hireDate: new Date(),
        phone: undefined,
        address: undefined,
        status: ''
    });
    const [emailInput, setEmailInput] = useState('');
    const [userNameInput, setUserNameInput] = useState('');
    const [depIdInput, setDepIdInput] = useState(0);
    const [posIdInput, setPosIdInput] = useState(0);
    const [phoneInput, setPhoneInput] = useState('');
    const [addressInput, setAddressInput] = useState('');
    const [addressDetailInput, setAddressDetailInput] = useState('');


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
    }

    // 사원 추가 버튼
    const handleCreate = () => {
        setCreateUser({
            userNo: 0,
            email: emailInput,
            userName: userNameInput,
            depId: depIdInput,
            posId: posIdInput,
            profile: '/resources/static/images/p/default.png',
            roles: [],
            hireDate: new Date(),
            phone: phoneInput,
            address: addressInput,
            addressDetail: addressDetailInput,
            status: 'T'
        })
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

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>

    return (
        <div className="max-w-7xl mx-auto p-5 font-sans text-gray-800">
            <h1 className="text-2xl font-bold mb-5 text-left">사원관리</h1>

            <div className="flex flex-wrap items-center justify-start gap-5 p-4 mb-5 border rounded-lg bg-gray-50 border-gray-200">
                <span className="flex items-center font-bold whitespace-nowrap">
                    사원명
                    <input
                        type="text"
                        placeholder="사원명 검색"
                        name="userName"
                        value={searchValues.userName}
                        onChange={handleChange}
                        className="ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </span>
                <span className="flex items-center font-bold whitespace-nowrap">
                    부서
                    <select
                        name="parentDepId"
                        value={searchValues.parentDepId || ''}
                        onChange={handleChange}
                        className="ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                    >
                        <option value="">전체</option>
                        {parentDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </span>
                <span className="flex items-center font-bold whitespace-nowrap">
                    상세 부서
                    <select
                        name="childDepId"
                        value={searchValues.childDepId || ''}
                        onChange={handleChange}
                        disabled={!searchValues.parentDepId}
                        className="ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        <option value="">전체</option>
                        {childDep?.map(dep => (
                            <option key={dep.depId} value={dep.depId}>
                                {dep.depName}
                            </option>
                        ))}
                    </select>
                </span>
                <span className="flex items-center font-bold whitespace-nowrap">
                    직위
                    <select
                        name="posName"
                        value={searchValues.posName}
                        onChange={handleChange}
                        className="ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                    >
                        <option value="">전체</option>
                        {position?.map(pos => (
                            <option key={pos.posId} value={pos.posName}>
                                {pos.posName}
                            </option>
                        ))}
                    </select>
                </span>
                <span className="flex items-center font-bold whitespace-nowrap">
                    재직상태
                    <select
                        name="status"
                        value={searchValues.status}
                        onChange={handleChange}
                        className="ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                    >
                        <option value="">전체</option>
                        <option value="T">재직</option>
                        <option value="F">퇴직</option>
                    </select>
                </span>
            </div>

            <div className="flex justify-end gap-2 mb-5">
                <button
                    onClick={handleReset}
                    className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                    초기화
                </button>
                <button
                    onClick={handleSearch}
                    className="py-2 px-4 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors"
                >
                    검색
                </button>
                <button
                    onClick={handleCreate}
                    className="py-2 px-4 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition-colors"
                >
                    사원등록
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">NO</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">사원번호</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">사원명</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">이메일</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">입사일</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">소속</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">직위</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">전화번호</th>
                            <th scope="col" className="px-6 py-3 font-bold text-left whitespace-nowrap text-xs text-gray-600 uppercase tracking-wider">재직상태</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members && members.length > 0 ? (
                            members.map((member, index) => (
                                <tr key={member.userNo} onDoubleClick={() => handleDetailOpen(member.userNo)} className="hover:bg-gray-100 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.userNo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.hireDate.split('T')[0]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.depName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.posName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.status === 'T' ? '재직' : '퇴직'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 whitespace-nowrap text-center text-gray-600">조회하려는 사원이 없습니다.</td>
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