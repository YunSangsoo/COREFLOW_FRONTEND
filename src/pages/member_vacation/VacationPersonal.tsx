import { useState } from "react";
import VacDate from "../../components/member_vacation/VacDate";
import VacSideBar from "../../components/member_vacation/vacSideBar";
import dayjs from "dayjs";
import type { LoginUser, MemberVacation } from "../../types/vacation";
import { useQuery } from "@tanstack/react-query";
import { loginUser, loginUserVacation } from "../../api/vacationApi";
import PutVacation from "../../components/member_vacation/putVacation";
import Pagination from "../../components/Approval/Pagination";

export default function VacationPersonal() {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const [selectYear, setSelectYear] = useState(dayjs().year());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleOpenModal = () => {
        setIsModalOpen(true);
    }
    const handleCloseModal = () => {
        setIsModalOpen(false);
    }

    const handleDateChange = (year: number) => {
        setSelectYear(year);
        setCurrentPage(1);
    }

    const { data: loginUserProfile } = useQuery<LoginUser>({
        queryKey: ['userProfile'],
        queryFn: () => loginUser()
    })

    const { data: loinUserVacation } = useQuery<MemberVacation[]>({
        queryKey: ['personalVacation', selectYear],
        queryFn: () => loginUserVacation(selectYear)
    })

    const indexOfLastUserVacation = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstUserVacation = indexOfLastUserVacation - ITEMS_PER_PAGE;
    const currentUserVacation = loinUserVacation?.slice(indexOfFirstUserVacation, indexOfLastUserVacation);
    const totalPages = loinUserVacation && Math.ceil(loinUserVacation.length / ITEMS_PER_PAGE) || 0;

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">휴가 관리</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><VacSideBar /></div>
                
                <div className="flex-1 min-w-0">
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">
                        
                        <div className="bg-blue-50 p-6">
                            <h2 className="text-2xl font-extrabold text-gray-800 mb-3 border-b border-blue-200 pb-2">
                                {loginUserProfile?.userName} 님의 휴가 정보
                            </h2>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-8 text-sm text-gray-700 md:w-auto">
                                    <div className="flex items-center">
                                        <span className="font-semibold w-16 text-blue-600">부서명</span>
                                        <span className="flex-1 truncate">{loginUserProfile?.depName || '-'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold w-16 text-blue-600">직위</span>
                                        <span className="flex-1 truncate">{loginUserProfile?.posName || '-'}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold w-16 text-blue-600">입사일</span>
                                        <span className="flex-1">
                                            {loginUserProfile?.hireDate ? dayjs(loginUserProfile.hireDate).format('YYYY-MM-DD') : '-'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-start md:justify-end">
                                    <button
                                        onClick={handleOpenModal}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
                                        휴가 등록
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {isModalOpen && <PutVacation onClose={handleCloseModal} />}
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
                        <VacDate selectYear={selectYear} onDateChange={handleDateChange} />
                    </div>

                    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="w-12 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">No</th>
                                    <th className="w-24 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">휴가 구분</th>
                                    <th className="w-28 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">시작일</th>
                                    <th className="w-28 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">종료일</th>
                                    <th className="w-20 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">일수</th>
                                    <th className="w-20 p-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentUserVacation && currentUserVacation?.length > 0 ? (
                                    currentUserVacation.map((item, index) => (
                                        <tr key={index} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition duration-150">
                                            <td className="p-3 text-center font-medium text-gray-700">{index + 1 + indexOfFirstUserVacation}</td>
                                            <td className="p-3 text-center">{item.vacName}</td>
                                            <td className="p-3 text-center">{dayjs(item.vacStart).format("YYYY-MM-DD")}</td>
                                            <td className="p-3 text-center">{dayjs(item.vacEnd).format('YYYY-MM-DD')}</td>
                                            <td className="p-3 text-center font-bold text-blue-600">{item.vacAmount}</td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full
                                                    ${item.status === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                                      item.status === 2 ? 'bg-green-100 text-green-800' : 
                                                      'bg-red-100 text-red-800'}`}>
                                                    {item.status === 1 ? "대기" : item.status === 2 ? "승인" : "반려"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center p-6 text-gray-500">
                                            해당 연도에 신청된 휴가 내역이 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
    );
}