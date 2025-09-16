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
        <div className="max-w-4xl mx-auto p-6 bg-white">
            <h1 className="text-2xl font-bold mb-6">휴가관리</h1>
            
            <div className="flex gap-6">
                <VacSideBar/>
                        
                <div className="flex-1">
                    <div className="border border-gray-300 max-w-md">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-600 text-white">
                                    <th className="px-3 py-2 text-center font-medium w-20">no</th>
                                    <th className="px-3 py-2 text-center font-medium w-50">근무기간</th>
                                    <th className="px-3 py-2 text-center font-medium w-40">연차 일 수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.map((vacation, index) => (
                                    <tr key={index} className="border-b border-gray-300">
                                        <td className="px-3 py-2 text-center bg-gray-100">{index + 1}</td>
                                        <td className="px-3 py-2 text-center">
                                            {vacation.workPrd}년 이상
                                        </td>
                                        <td className="px-3 py-2 text-center">{vacation.vacAmount}일</td>
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