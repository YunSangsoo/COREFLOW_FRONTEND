import { useState } from "react";
import dayjs from 'dayjs';

interface VacationMemberProps {
    selectYear : number;
    onYearChange : (year:number) => void;
}
export default function SearchYear({selectYear,onYearChange}:VacationMemberProps) {

    // 리스트 표시용 훅
    const [isYearList, setIsYearList] = useState(false);

    const prevYear = () => {onYearChange(selectYear - 1)}

    const nextYear = () => {if(selectYear < dayjs().year()){onYearChange(selectYear + 1)}}

    const yearList = () => {setIsYearList(!isYearList);}

    return (
        <div className="flex flex-col items-center p-4 font-sans">
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                <button onClick={prevYear}
                    className="p-2 rounded-md transition-colors hover:bg-gray-100">
                    {'<'}
                </button>
                <span onClick={yearList}
                    className="p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100">
                    {selectYear}
                </span>
                <button onClick={nextYear}
                    className="p-2 rounded-md transition-colors hover:bg-gray-100">
                    {'>'}
                </button>
            </div>

            {isYearList && (
                <div className="mt-4 w-48 h-52 overflow-y-scroll border border-gray-300 rounded-lg shadow-lg bg-white">
                    {Array.from({ length: 31 }, (_, i) => dayjs().year() - i).map(year => (
                        <div key={year} onClick={() => {onYearChange(year); setIsYearList(false);}}
                            className={`p-2 cursor-pointer transition-colors hover:bg-gray-200 
                                ${year === selectYear ? 'bg-blue-500 text-white font-semibold' : ''}`}>
                            {year}
                        </div>
                    ))}
                </div>
                )
            }
        </div>
    )
}