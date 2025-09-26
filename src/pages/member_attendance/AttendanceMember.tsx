import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Attendance } from "../../types/attendance";
import { memAttendance, vacTypeUpdate } from "../../api/attendanceApi";
import dayjs from "dayjs";
import AttSideBar from "../../components/member_attendance/attSideBar";
import SearchMember from "../../components/member_vacation/SearchMember";
import type { MemberChoice, VacType } from "../../types/vacation";
import AttDate from "../../components/member_attendance/AttDate";
import { vacType } from "../../api/attendanceApi";
import Pagination from "../../components/Approval/Pagination";

export default function AttendanceMember() {
    const queryClient = useQueryClient();
    const [searchName, setSearchName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectMember, setSelectMember] = useState<MemberChoice | null>(null);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [vacTypeList, setVacTypeList] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { data: attData, isLoading, isError, error } = useQuery<Attendance[]>({
        queryKey: ['memAtt', currentDate.format('YYYY-MM-DD'), selectMember?.userNo],
        queryFn: () => memAttendance(currentDate.format('YYYY-MM-DD'), selectMember?.userNo ?? null),
    });

    const { data: vacData } = useQuery<VacType[]>({
        queryKey: ['vacType'],
        queryFn: vacType,
        enabled: vacTypeList !== null
    })

    const mutation = useMutation({
        mutationFn: vacTypeUpdate,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['memAtt', currentDate.format('YYYY-MM-DD'), selectMember?.userNo]
            });
            setVacTypeList(null);
        },
        onError: (error) => {
            console.log('비고 업데이트 실패 : ', error);
        }
    })

    const handleSearch = () => {
        setSearchQuery(searchName);
    }

    const handleSelectMember = (member: MemberChoice) => {
        setSearchName(member.userName);
        setSearchQuery('');
        setSelectMember(member);
        setCurrentPage(1);
    }

    const handleReset = () => {
        setSearchName('');
        setSearchQuery('');
        setSelectMember(null);
        setCurrentPage(1);
    }

    const handleVacType = (attId: number) => {
        setVacTypeList(vacTypeList === attId ? null : attId);
    }

    const handleVacSelect = (attId: number, vacCode: number) => {
        mutation.mutate({
            attId,
            vacCode
        })
    }
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(e.target as Node)) {
                setVacTypeList(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [])

    const indexOfLastAttendance = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstAttendance = indexOfLastAttendance - ITEMS_PER_PAGE;
    const currentAttendance = attData?.slice(indexOfFirstAttendance, indexOfLastAttendance);
    const totalPages = attData && Math.ceil(attData.length / ITEMS_PER_PAGE) || 0;

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">근태 관리</h1>


            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><AttSideBar /></div>

                <div className="flex-1 min-w-0">
                    <div className="relative">
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
                    </div>

                    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <AttDate selectDate={currentDate} onDateChange={setCurrentDate} />
                        </div>

                        <div className="flex flex-wrap items-center justify-start bg-white shadow-lg rounded-xl max-w-2xl lg:max-w-full">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-blue-50 border-b border-blue-200">
                                    <tr>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">No</th>
                                        <th className="w-20 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">날짜</th>
                                        <th className="w-24 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">성명</th>
                                        <th className="w-24 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">부서</th>
                                        <th className="w-16 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">직위</th>
                                        <th className="w-16 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">출근시각</th>
                                        <th className="w-16 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">퇴근시각</th>
                                        <th className="w-20 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">비고</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {
                                        currentAttendance && currentAttendance.length > 0 ? (
                                            currentAttendance.map((data, index) => (
                                                <tr className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition duration-150" key={data.attId}>
                                                    <td className="p-3 text-center font-medium text-gray-700">
                                                        {index + 1 + indexOfFirstAttendance}
                                                    </td>
                                                    <td className="p-3 text-center text-gray-800">{data.attDate}</td>
                                                    <td className="p-3 text-center text-gray-800 font-medium">{data.userName}</td>
                                                    <td className="p-3 text-center">{data.depName}</td>
                                                    <td className="p-3 text-center">{data.posName}</td>
                                                    <td className="p-3 text-center">{data.checkInTime || '-'}</td>
                                                    <td className="p-3 text-center">{data.checkOutTime || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        <div className="relative inline-block" ref={listRef}>
                                                            <button
                                                                onClick={() => handleVacType(data.attId)}
                                                                className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full shadow-sm cursor-pointer whitespace-nowrap transition-colors bg-blue-100 text-blue-800 ring-1 ring-blue-400">{data.vacName}
                                                            </button>
                                                            {vacTypeList === data.attId && (
                                                                <div className="absolute top-0 right-full mr-2 w-40 bg-white border border-gray-300 rounded-md shadow-xl z-20 overflow-hidden">
                                                                    <div ref={listRef} className="max-h-40 overflow-y-auto">
                                                                        {vacData && vacData.length > 0 ? (
                                                                            <ul>
                                                                                {vacData.map((vac) => (
                                                                                    <li key={vac.vacCode} onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            handleVacSelect(data.attId, vac.vacCode)                                                                                            
                                                                                        }}
                                                                                        className="p-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer transition-colors border-b last:border-b-0">
                                                                                        {vac.vacName}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <div className="p-2 text-center text-xs text-gray-500">휴가 구분이 없습니다.</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) :
                                            <tr>
                                                <td colSpan={8} className="text-center p-12 text-lg text-gray-500 bg-white">
                                                    근태 기록이 없습니다.
                                                </td>
                                            </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}