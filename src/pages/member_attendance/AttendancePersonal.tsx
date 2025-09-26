import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Attendance } from "../../types/attendance";
import dayjs from "dayjs";
import AttSideBar from "../../components/member_attendance/attSideBar";
import type { LoginUser } from "../../types/vacation";
import VacDate from "../../components/member_vacation/VacDate";
import { loginUser } from "../../api/vacationApi";
import { loginUserAttendance } from "../../api/attendanceApi";

export default function AttendancePersonal() {

    // 연도 상태 관리용 훅
    const [selectYear, setSelectYear] = useState(dayjs().year());
    const [selectMonth, setSelectMonth] = useState(dayjs().month() + 1);

    // 날짜 상태 업데이트
    const handleDateChange = (year: number, month?: number) => {
        setSelectYear(year);
        if (month !== undefined) {
            setSelectMonth(month);
        }
    }

    // 로그인 사용자 정보 조회
    const { data: loginUserProfile } = useQuery<LoginUser>({
        queryKey: ['userProfile'],
        queryFn: () => loginUser()
    })

    // 로그인 사용자 근태정보
    const { data: loginUserAtt, isLoading, isError, error } = useQuery<Attendance[]>({
        queryKey: ['loginUserAtt', selectYear, selectMonth],
        queryFn: () => loginUserAttendance(selectYear, selectMonth)
    });

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">근태 관리</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><AttSideBar /></div>

                <div className="flex-1 min-w-0">
                    <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-6">

                        <div className="bg-blue-50 p-6">
                            <h2 className="text-2xl font-extrabold text-gray-800 mb-3 border-b border-blue-200 pb-2">{loginUserProfile?.userName} 님의 근태 정보</h2>

                            <div className="flex flex-wrap gap-x-12 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span className="font-semibold min-w-[70px]">부서명 :</span>
                                    <span className="flex-1">{loginUserProfile?.depName || '-'}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold min-w-[70px]">직위 :</span>
                                    <span className="flex-1">{loginUserProfile?.posName || '-'}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold min-w-[70px]">입사일 :</span>
                                    <span className="flex-1">
                                        {loginUserProfile?.hireDate ? dayjs(loginUserProfile.hireDate).format('YYYY-MM-DD') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded-b-lg overflow-hidden mb-8">
                        <VacDate selectYear={selectYear} selectMonth={selectMonth} onDateChange={handleDateChange}/>
                        
                        <div className="flex flex-wrap items-center justify-start bg-white shadow-lg rounded-xl overflow-hidden max-w-2xl lg:max-w-full">
                            <table className="min-w-full bg-white border-collapse">
                                <thead className="bg-blue-50 border-b border-blue-200">
                                    <tr>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">No</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">날짜</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">성명</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">부서</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">직위</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">출근시각</th>
                                        <th className="w-12 p-3 text-center text-xs font-bold uppercase tracking-wider text-blue-700">퇴근시각</th>
                                        <th className="w-16 p-2 text-center text-xs font-bold uppercase tracking-wider text-blue-700">비고</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        loginUserAtt && loginUserAtt.length > 0 ? (
                                            loginUserAtt.map((data, index) => (
                                                <tr className="border-b border-gray-200 hover:bg-gray-50 transition duration-150" key={data.attId}>
                                                    <td className="w-12 p-2 border-r border-gray-200 text-center text-gray-700">{index + 1}</td>
                                                    <td className="w-20 p-2 border-r border-gray-200 text-center font-medium">{data.attDate}</td>
                                                    <td className="w-24 p-2 border-r border-gray-200 text-center">{data.userName}</td>
                                                    <td className="w-24 p-2 border-r border-gray-200 text-center">{data.depName}</td>
                                                    <td className="w-16 p-2 border-r border-gray-200 text-center">{data.posName}</td>
                                                    <td className="w-16 p-2 border-r border-gray-200 text-center">{data.checkInTime || "-"}</td>
                                                    <td className="w-16 p-2 border-r border-gray-200 text-center">{data.checkOutTime || "-"}</td>
                                                    <td className="w-16 p-2 text-center">{data.vacName}</td>
                                                </tr>
                                            ))
                                        ) :
                                            <tr>
                                                <td colSpan={8} className="p-6 text-center text-gray-500 bg-white">
                                                    선택하신 {selectYear}년 {selectMonth}월에 근태 기록이 없습니다.
                                                </td>
                                            </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}