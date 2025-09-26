import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { PutVacation, VacType } from "../../types/vacation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { putVacation, vacType } from "../../api/vacationApi";
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);

interface PutVacationProps {
    onClose: () => void
}

export default function PutVacation(props: PutVacationProps) {
    const queryClient = useQueryClient();

    const { data } = useQuery<VacType[]>({
        queryKey: ['vacType'],
        queryFn: vacType
    })

    const [vacationData, setVacationData] = useState<PutVacation>({
        vacCode: 4,
        vacStart: '',
        vacEnd: '',
        vacAmount: 0
    })

    const { mutate, isSuccess } = useMutation({
        mutationFn: (data: PutVacation) => putVacation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personalVacation'] });
            alert("휴가 신청 완료");
        },
        onError: () => {
            alert("휴가 신청 실패");
        }
    })

    useEffect(() => {
        if (isSuccess) {
            props.onClose();
        }
    }, [isSuccess])

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVacationData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const dateObj = dayjs(value);
        if (dateObj.isValid()) {
            setVacationData((prev) => ({
                ...prev, [name]: dateObj.format('YYYY-MM-DD')
            }))
        } else {
            alert('날짜 형식이 올바르지 않습니다.')
            setVacationData((prev) => ({
                ...prev, [name]: ''
            }))
        }
    }

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVacationData((prevData) => ({
            ...prevData,
            [name]: Number(value)
        }));
    };

    const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVacationData((prevData) => ({
            ...prevData,
            [name]: Number(value)
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // 제출 전 유효성 검증
        const vacStartDayjs = dayjs(vacationData.vacStart);
        const vacEndDayjs = dayjs(vacationData.vacEnd);

        if (!vacStartDayjs.isValid() || !vacEndDayjs.isValid()) {
            alert("휴가 시작일과 종료일을 올바른 날짜 형식으로 입력해주세요.");
            return;
        }

        if (vacEndDayjs.isSameOrAfter(vacStartDayjs) === false) {
            alert("휴가 종료일은 시작일보다 빠를 수 없습니다.");
            return;
        }

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
                            name="vacCode" value={vacationData.vacCode} onChange={handleSelectChange}
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
                            type="date" name="vacStart" value={vacationData.vacStart} onChange={handleDateChange} onBlur={handleDateBlur}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">휴가 종료일</label>
                        <input
                            type="date" name="vacEnd" value={vacationData.vacEnd} onChange={handleDateChange} onBlur={handleDateBlur}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">사용 일수</label>
                        <input
                            type="number" name="vacAmount" min="0.5" step="0.5" value={vacationData.vacAmount} onChange={handleNumberChange}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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