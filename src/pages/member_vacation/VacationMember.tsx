import VacSideBar from "../../components/member_vacation/vacSideBar";
import SearchMember from "../../components/member_vacation/SearchMember";
import { useState } from "react";
import type { MemberChoice, MemberVacation } from "../../types/vacation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memVacation, memVacationAll, vacStatusUpdate } from "../../api/vacationApi";
import dayjs from "dayjs";
import VacDate from "../../components/member_vacation/VacDate";
import Pagination from "../../components/Approval/Pagination";

export default function VacationMember() {
    const queryClient = useQueryClient();
    // 사원명 입력값 저장용 훅
    const [searchName, setSearchName] = useState('');

    // input내부 상태 훅
    const [searchQuery, setSearchQuery] = useState('');

    // 선택한 사원 데이터 저장용 훅
    const [selectMember, setSelectMember] = useState<MemberChoice | null>(null);

    // 연도 상태 관리용 훅
    const [selectYear, setSelectYear] = useState(dayjs().year());
    const [selectMonth, setSelectMonth] = useState(dayjs().month() + 1);

    // 모든 사원 연차내역 조회용 훅(기본)
    const { data: allVacation, error: allError } = useQuery<MemberVacation[]>({
        queryKey: ['allVacation', selectYear, selectMonth],
        queryFn: () => memVacationAll(selectYear, selectMonth)
    })

    // 특정 사원 연차내역 조회용 훅(사원 선택시)
    const { data: memberVacation, error: memberError } = useQuery<MemberVacation[]>({
        queryKey: ['memberVacation', selectMember?.userNo, selectYear, selectMonth],
        queryFn: () => {
            if (!selectMember?.userNo) {
                return Promise.resolve([]);
            }
            return memVacation(selectMember.userNo, selectYear, selectMonth);
        },
        enabled: !!selectMember
    })

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // 사원 선택 or 선택안함
    const displayData = selectMember ? memberVacation : allVacation;
    const displayError = selectMember ? memberError : allError;

    // 검색 버튼
    const handleSearch = () => {
        setSearchQuery(searchName);
    }

    // 사원 선택시 실행
    const handleSelectMember = (member: MemberChoice) => {
        setSearchName(member.userName);
        setSearchQuery(member.userName);
        setSelectMember(member);
        setCurrentPage(1);
    }

    // 초기화 버튼
    const handleReset = () => {
        setSearchName('');
        setSearchQuery('');
        setSelectMember(null);
        setCurrentPage(1);
    }

    // 날짜 상태 업데이트
    const handleDateChange = (year: number, month?: number) => {
        setSelectYear(year);
        if (month !== undefined) {
            setSelectMonth(month);
            setCurrentPage(1);
        }
    }

    // 휴가 상태값 변경
    const mutation = useMutation({
        mutationFn: ({ vacId, newState }: { vacId: number, newState: number }) => vacStatusUpdate(vacId, newState),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allVacation', selectYear, selectMonth] });
            queryClient.invalidateQueries({ queryKey: ['memberVacation', selectYear, selectMonth] });
        }
    })

    const handleVacStatusUpdate = (vacId: number, status: number) => {
        const updateStatus = (status % 3) + 1;
        mutation.mutate({ vacId, newState: updateStatus });
    }

    const indexOfLastVacation = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstVacation = indexOfLastVacation - ITEMS_PER_PAGE;
    const currentVacation = displayData?.slice(indexOfFirstVacation, indexOfLastVacation);
    const totalPages = displayData && Math.ceil(displayData.length / ITEMS_PER_PAGE) || 0;

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">휴가 관리</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><VacSideBar /></div>

                <div className="flex-1 min-w-0">
                    {/* 사원 검색 섹션 */}
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6 border border-gray-200">
                        <div className="bg-gray-50 p-6 flex flex-col sm:flex-row items-center gap-4">
                            <label htmlFor="search-member" className="font-semibold text-gray-700 w-full sm:w-auto sm:text-left text-center">사원명 검색</label>
                            <div className="flex flex-1 w-full gap-2 items-stretch">
                                <input
                                    id="search-member"
                                    onChange={(e) => setSearchName(e.target.value)}
                                    value={searchName}
                                    type="text"
                                    placeholder="사원명을 입력하세요"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                                    검색
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2 bg-gray-800 text-white font-bold text-sm rounded-lg shadow-md hover:bg-gray-900 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                                    초기화
                                </button>
                            </div>
                        </div>
                    </div>

                    {searchQuery && <SearchMember searchName={searchQuery} onSelectMember={handleSelectMember} />}
                    
                    {/* 날짜 선택 섹션 */}
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6 border border-gray-200 p-4">
                        <VacDate selectYear={selectYear} selectMonth={selectMonth} onDateChange={handleDateChange} />
                    </div>

                    {/* 휴가 목록 테이블 */}
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-blue-50 border-b border-blue-200">
                                <tr>
                                    <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">No</th>
                                    <th className="w-24 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">사원명</th>
                                    <th className="w-20 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">휴가 구분</th>
                                    <th className="w-28 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">시작일</th>
                                    <th className="w-28 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">종료일</th>
                                    <th className="w-16 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">일수</th>
                                    <th className="w-20 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {
                                    currentVacation && currentVacation.length > 0 ? (
                                        currentVacation.map((item, index) => (
                                            <tr key={item.vacId} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition duration-150 cursor-pointer">
                                                <td className="p-3 text-center font-medium text-gray-700">
                                                    {index + 1 + indexOfFirstVacation}
                                                </td>
                                                <td className="p-3 text-center text-gray-800 font-medium">{item.userName}</td>
                                                <td className="p-3 text-center">{item.vacName}</td>
                                                <td className="p-3 text-center">{dayjs(item.vacStart).format("YYYY-MM-DD")}</td>
                                                <td className="p-3 text-center">{dayjs(item.vacEnd).format('YYYY-MM-DD')}</td>
                                                <td className="p-3 text-center font-extrabold text-blue-600">{item.vacAmount}</td>
                                                <td className="p-3 text-center">
                                                    <span
                                                        onClick={() => handleVacStatusUpdate(item.vacId, item.status)}
                                                        className={`inline-flex items-center justify-center px-4 py-1 text-xs font-bold rounded-full shadow-sm cursor-pointer whitespace-nowrap
                                                            ${item.status === 1 ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400' :
                                                                item.status === 2 ? 'bg-green-100 text-green-800 ring-1 ring-green-400' :
                                                                'bg-red-100 text-red-800 ring-1 ring-red-400'}`}>
                                                        {item.status === 1 ? "📝 대기" : item.status === 2 ? "✅ 승인" : "❌ 반려"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center p-12 text-lg text-gray-500 bg-white">
                                                {displayError ? `데이터를 불러오는 중 오류가 발생했습니다: ${displayError.message}` : "조회된 휴가 내역이 없습니다."}
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
}