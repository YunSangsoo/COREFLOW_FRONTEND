import { vacInfo } from "../../api/vacationApi";
import VacSideBar from "../../components/member_vacation/vacSideBar";
import type { VacationInfo } from "../../types/vacation";
import { useQuery } from "@tanstack/react-query";

export default function VacationInfo() {

    // 연차 정보 조회용 훅
    const { data, isLoading, isError, error } = useQuery<VacationInfo[]>({
        queryKey: ['vacInfo'],
        queryFn: vacInfo
    })

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>{error.message}</div>

    return (
        <div className="max-w-6xl mx-auto p-8 lg:p-12 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b pb-2">휴가 관리</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64"><VacSideBar /></div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-start bg-white shadow-lg rounded-xl overflow-hidden max-w-2xl lg:max-w-full">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-center uppercase tracking-wider font-bold text-lg">No</th>
                                    <th className="px-4 py-3 text-center uppercase tracking-wider font-bold text-lg">근무 기간</th>
                                    <th className="px-4 py-3 text-center uppercase tracking-wider font-bold text-lg">연차 일 수</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.map((vacation, index) => (
                                    <tr key={index} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                                        <td className="px-4 py-3 text-center font-medium bg-gray-50 text-gray-700">{index + 1}</td>
                                        <td className="px-4 py-3 text-center text-gray-600"><span className="font-semibold">{vacation.workPrd}</span>년 이상</td>
                                        <td className="px-4 py-3 text-center">{vacation.vacAmount}일</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};