import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { PutVacation, VacType } from "../../types/vacation";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { putVacation, vacType } from "../../api/vacationApi";

interface PutVacationProps{
    onClose: () => void
}

export default function PutVacation(props:PutVacationProps){
    const queryClient = useQueryClient();

    const {data} = useQuery<VacType[]>({
        queryKey:['vacType'],
        queryFn:vacType
    })
    
    const [vacationData, setVacationData] = useState<PutVacation>({
        vacCode:1,
        vacStart:'',
        vacEnd:'',
        vacAmount:0
    })
    
    const {mutate,isSuccess} = useMutation({
        mutationFn:(data:PutVacation) => putVacation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['putVacation']});
            alert("휴가 신청 완료");
        },
        onError:()=>{
            alert("휴가 신청 실패");
        }
    })

    useEffect(() => {
        if(isSuccess){
            props.onClose();
        }
    },[isSuccess])
    
    const handleInputChange = (e:ChangeEvent<HTMLSelectElement|HTMLInputElement>) => {
        const {name,value} = e.target;
        setVacationData((prevData) => ({
            ...prevData,
            [name]:name === "vacAmount" || name === "vacCode" ? Number(value) : value}))
    }
    
    const handleSubmit = (e:FormEvent) => {
        e.preventDefault();
        mutate(vacationData);
        props.onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-95">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">휴가 신청</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">휴가 종류</label>
                        <select 
                            name="vacCode" value={vacationData.vacCode} onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {data && data.length > 0 ? (
                                data.map((vac) => (
                                    <option key={vac.vacCode} value={vac.vacCode}>{vac.vacName}</option>))
                                ) : <option></option>
                            }
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">휴가 시작일</label>
                        <input
                            type="date" name="vacStart" value={vacationData.vacStart} onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">휴가 종료일</label>
                        <input
                            type="date" name="vacEnd" value={vacationData.vacEnd} onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">사용 일수</label>
                        <input
                            type="number" name="vacAmount" min="0.5" step="0.5"  value={vacationData.vacAmount} onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200">
                            신청
                        </button>
                        <button
                            type="button" onClick={props.onClose}
                            className="px-6 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 transition-colors duration-200">
                            닫기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}