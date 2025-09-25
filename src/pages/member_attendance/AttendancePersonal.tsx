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
        <div className="max-w-6xl mx-auto p-8 lg:p-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">근태 관리</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><AttSideBar /></div>

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
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded overctDate={selectDate} onDateChange={setSelectDate}flow-hidden">
                        <VacDate selectYear={selectYear} selectMonth={selectMonth} onDateChange={handleDateChange} />
                        <table className="min-w-full bg-white border-collapse">
                            <thead>
                                <tr className="bg-gray-200 border-b border-gray-300 text-sm font-semibold">
                                    <th className="w-12 p-2 border-r border-gray-300 text-center">no</th>
                                    <th className="w-20 p-2 border-r border-gray-300 text-center">날짜</th>
                                    <th className="w-24 p-2 border-r border-gray-300 text-center">성명</th>
                                    <th className="w-24 p-2 border-r border-gray-300 text-center">부서</th>
                                    <th className="w-16 p-2 border-r border-gray-300 text-center">직위</th>
                                    <th className="w-16 p-2 border-r border-gray-300 text-center">출근시각</th>
                                    <th className="w-16 p-2 border-r border-gray-300 text-center">퇴근시각</th>
                                    <th className="w-16 p-2 border-r border-gray-300 text-center">비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    loginUserAtt && loginUserAtt.length > 0 ? (
                                        loginUserAtt.map((data, index) => (
                                            <tr className="border-b border-gray-200" key={data.attId}>
                                                <td className="w-12 p-2 border-r border-gray-200 text-center">{index + 1}</td>
                                                <td className="w-20 p-2 border-r border-gray-200 text-center">{data.attDate}</td>
                                                <td className="w-24 p-2 border-r border-gray-200 text-center">{data.userName}</td>
                                                <td className="w-24 p-2 border-r border-gray-200 text-center">{data.depName}</td>
                                                <td className="w-16 p-2 border-r border-gray-200 text-center">{data.posName}</td>
                                                <td className="w-16 p-2 border-r border-gray-200 text-center">{data.checkInTime || "-"}</td>
                                                <td className="w-16 p-2 border-r border-gray-200 text-center">{data.checkOutTime || "-"}</td>
                                                <td className="w-16 p-2 border-r border-gray-200 text-center">{data.vacName}</td>
                                            </tr>
                                        ))
                                    ) :
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-gray-500">근태 기록이 없습니다.</td>
                                        </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
