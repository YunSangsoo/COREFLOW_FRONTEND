import { useState } from "react";
import VacDate from "../../components/member_vacation/VacDate";
import VacSideBar from "../../components/member_vacation/vacSideBar";
import dayjs from "dayjs";
import type { LoginUser, MemberVacation } from "../../types/vacation";
import { useQuery } from "@tanstack/react-query";
import { loginUser, loginUserVacation } from "../../api/vacationApi";
import PutVacation from "../../components/member_vacation/putVacation";

export default function VacationPersonal() {

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
    }

    // 임시 로그인.. 찐 로그인 유저 가지고 하는건 내일해볼까 우리?
    const loginUserNo = 61;
    const { data: loginUserProfile } = useQuery<LoginUser>({
        queryKey: ['userProfile', loginUserNo],
        queryFn: () => loginUser()
    })

    const { data: loinUserVacation } = useQuery<MemberVacation[]>({
        queryKey: ['personalVacation', loginUserNo, selectYear],
        queryFn: () => loginUserVacation(selectYear)
    })

    return (
        <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6">내 연차 관리</h1>
            <div className="flex gap-6">
                <VacSideBar />
                <div className="flex-1">
                    <div className="bg-gray-100 p-4 rounded-t-lg border border-gray-300">
                        <h2 className="text-xl font-bold mb-2">{loginUserProfile?.userName}</h2>
                        <div className="flex flex-wrap gap-x-12 text-sm text-gray-600">
                            <div className="flex items-center">
                                <span className="font-semibold min-w-[70px]">부서명 :</span>
                                <span className="flex-1">{loginUserProfile?.depName}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold min-w-[70px]">직위 :</span>
                                <span className="flex-1">{loginUserProfile?.posName}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold min-w-[70px]">입사일 :</span>
                                <span className="flex-1">{dayjs(loginUserProfile?.hireDate).format('YYYY-MM-DD')}</span>
                            </div>
                            <button 
                                onClick={handleOpenModal}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
                                휴가 등록
                            </button>
                            {isModalOpen && <PutVacation onClose={handleCloseModal}  />}
                        </div>
                    </div>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                        <div>
                            <VacDate selectYear={selectYear} onDateChange={handleDateChange} />
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded overflow-hidden mt-4">
                        <div className="bg-gray-200 border-b border-gray-300">
                            <div className="flex text-sm font-semibold">
                                <div className="w-12 p-2 border-r border-gray-300 text-center">no</div>
                                <div className="w-20 p-2 border-r border-gray-300 text-center">휴가 구분</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">시작일</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">종료일</div>
                                <div className="w-16 p-2 border-r border-gray-300 text-center">휴가 일수</div>
                                <div className="w-16 p-2 text-center">상태</div>
                            </div>
                        </div>

                        <div className="bg-white">
                            {loinUserVacation && loinUserVacation?.length > 0 ? (
                                loinUserVacation.map((item, index) => (
                                    <div key={index} className="flex text-sm border-b border-gray-200">
                                        <div className="w-12 p-2 border-r border-gray-200 text-center">{index + 1}</div>
                                        <div className="w-20 p-2 border-r border-gray-300 text-center">{item.vacName}</div>
                                        <div className="w-24 p-2 border-r border-gray-200 text-center">{dayjs(item.vacStart).format("YYYY-MM-DD")}</div>
                                        <div className="w-24 p-2 border-r border-gray-200 text-center">{dayjs(item.vacEnd).format('YYYY-MM-DD')}</div>
                                        <div className="w-16 p-2 border-r border-gray-200 text-center">{item.vacAmount}</div>
                                        <div className="w-16 p-2 text-center">{item.status === 1 ? "승인" : item.status === 2 ? "대기" : "반려"}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4">해당 연도에 신청된 연차가 없습니다.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
