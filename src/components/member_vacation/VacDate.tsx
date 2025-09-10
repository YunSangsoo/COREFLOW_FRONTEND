import { useEffect, useRef, useState } from "react";
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
dayjs.locale('ko');

interface VacationMemberProps {
    selectYear : number;
    selectMonth? : number;
    onDateChange : (year:number,month?:number) => void;
}
export default function VacDate({selectYear,selectMonth,onDateChange}:VacationMemberProps) {

    // 리스트 표시용 훅
    const [isYearList, setIsYearList] = useState(false);
    const [isMonthList, setIsMonthList] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    // 월 관리
    const prevMonth = () => {
        if(selectMonth !== undefined){
            const newDate = dayjs(new Date(selectYear, selectMonth -1)).subtract(1,'month');
            onDateChange(newDate.year(), newDate.month() + 1);
        }
    }
    const nextMonth = () => {
        if(selectMonth !== undefined) {
            const currentMonthDayjs = dayjs();
            const nextMonthDayjs = dayjs(new Date(selectYear, selectMonth -1)).add(1,'month');
            
            if(nextMonthDayjs.isAfter(currentMonthDayjs,'month')){
                return;
            }
            onDateChange(nextMonthDayjs.year(), nextMonthDayjs.month() +1);
        }
    }

    // 년도 관리
    const prevYear = () => {
        if(selectMonth === undefined){
            onDateChange(selectYear -1)
        }
    }
    const nextYear = () => {
        if(selectMonth === undefined) {
            if(selectYear >= dayjs().year()) return;
            onDateChange(selectYear +1);
        }
    }
    
    // 리스트 관리
    const yearList = () => {
        setIsYearList(!isYearList);
        setIsMonthList(false);
    }
    const monthList = () => {
        if(selectMonth !== undefined){
            setIsMonthList(!isMonthList);
            setIsYearList(false);
        }
    }

    const years = Array.from({length:31},(_,i) => dayjs().year() - i);
    const months = Array.from({length:12},(_,i) => i + 1);

    // 리스트 선택시
    const handleSelectYear = (year:number) => {
        onDateChange(year,selectMonth);
        setIsYearList(false);
    }
    const handleSelectMonth = (month:number) => {
        if(selectMonth !== undefined){
            onDateChange(selectYear,month);
            setIsMonthList(false);
        }
    }

    // 리스트 외부 클릭시 닫기
    useEffect(() => {
        const handleClickOutside = (e:MouseEvent) => {
            if(listRef.current && !listRef.current.contains(e.target as Node)){
                setIsYearList(false);
                setIsMonthList(false);
            }
        }

        document.addEventListener("mousedown",handleClickOutside);
        
        return () => {
            document.removeEventListener("mousedown",handleClickOutside);
        }
    },[listRef])


    return (
        <div ref={listRef} className="flex flex-col items-center p-4 font-sans">
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                <button onClick={selectMonth !== undefined ? prevMonth : prevYear}
                    className="p-2 rounded-md transition-colors hover:bg-gray-100">
                    {'<'}
                </button>
                <span onClick={yearList}
                    className="p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100">
                    {selectYear}년
                </span>
                {selectMonth !== undefined && (
                <span onClick={monthList}
                    className="p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100">
                    {selectMonth}월
                </span>
                )}
                <button onClick={selectMonth !== undefined ? nextMonth : nextYear}
                    className="p-2 rounded-md transition-colors hover:bg-gray-100">
                    {'>'}
                </button>
            </div>
            {isYearList && (
                <div className="absolute mt-14 w-48 h-52 overflow-y-scroll border border-gray-300 rounded-lg shadow-lg bg-white z-10">
                    {years.map(year => (
                        <div key={year} onClick={() => handleSelectYear(year)}
                            className={`p-2 cursor-pointer transition-colors hover:bg-gray-200 
                                ${year === selectYear ? 'bg-blue-500 text-white font-semibold' : ''}`}>
                            {year}
                        </div>
                    ))}
                </div>
            )}
            {isMonthList && (
                <div className="absolute mt-14 w-48 h-52 overflow-y-scroll border border-gray-300 rounded-lg shadow-lg bg-white z-10">
                    {months.map(month => (
                        <div key={month} onClick={() => handleSelectMonth(month)}
                            className={`p-2 cursor-pointer transition-colors hover:bg-gray-200 
                                ${month === selectMonth ? 'bg-blue-500 text-white font-semibold' : ''}`}>
                            {month}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}