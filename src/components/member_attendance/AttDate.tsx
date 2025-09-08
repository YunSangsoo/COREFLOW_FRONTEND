import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
dayjs.locale('ko')

// const ChevronLeftIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-4 h-4 fill-current">
//     <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
//   </svg>
// );

// const ChevronRightIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-4 h-4 fill-current">
//     <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/>
//   </svg>
// );

// const CalendarIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-current">
//     <path d="M96 32V64H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48h-48V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V64H160V32c0-17.7-14.3-32-32-32s-32 14.3-32 32zm-48 96c0-8.8 7.2-16 16-16h320c8.8 0 16 7.2 16 16v240H48V128z"/>
//   </svg>
// );

interface AttendanceProps {
    selectDate: dayjs.Dayjs;
    onDateChange: (date: dayjs.Dayjs) => void;
}
export default function AttDate({ selectDate, onDateChange }: AttendanceProps) {

    // 달력 표시용 훅
    const [isCalendar, setIsCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    // 월 정보용 훅
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    const prevDay = () => { onDateChange(selectDate.subtract(1, 'day')) }
    const nextDay = () => { onDateChange(selectDate.add(1, 'day')) }

    const prevMonth = () => { setCurrentMonth(currentMonth.subtract(1, 'month')) }
    const nextMonth = () => { setCurrentMonth(currentMonth.add(1, 'month')) }

    const handleYearChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(e.target.value, 10);
        setCurrentMonth(currentMonth.year(year));
    }

    const handleDayClick = (day: dayjs.Dayjs) => {
        onDateChange(day);
        setIsCalendar(false);
    }

    const daysInMonth = useMemo(() => {
        // 현재 월의 시작날짜 1, 끝 날짜 30 or 31 
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        // 달력의 시작 칸, 마지막 칸?
        const calendarStart = startOfMonth.startOf('week');
        const calendarEnd = endOfMonth.endOf('week');

        // 달력의 모든 날
        const days = [];
        let day = calendarStart;
        while (day.isBefore(calendarEnd) || day.isSame(calendarEnd)) {
            days.push(day);
            day = day.add(1, 'day');
        }
        return days;
    }, [currentMonth]);

    const years = useMemo(() => {
        const currentYear = dayjs().year();
        const yearRange = [];
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            yearRange.push(i);
        }
        return yearRange;
    }, []);

    // 달력 외부 클릭시 닫기
    useEffect(() => {
        const handleClickOutside = (e:MouseEvent) => {
            if(calendarRef.current && !calendarRef.current.contains(e.target as Node)){
                setIsCalendar(false);
            }
        }
        document.addEventListener("mousedown",handleClickOutside);

        return () => {
            document.removeEventListener("mousedown",handleClickOutside);
        }
    },[calendarRef])

    return (
        <div ref={calendarRef} className="relative flex items-center justify-between p-4 bg-gray-100 rounded-lg">
            <button onClick={prevDay} className="text-gray-600 hover:text-gray-800 transition-colors">
                {/* <ChevronLeftIcon/> */}
                {'<'}
            </button>
            <div className="flex items-center space-x-2 text-lg font-bold text-gray-800">
                {/* <CalendarIcon className="text-blue-500" /> */}
                <span className="cursor-pointer" onClick={() => setIsCalendar(!isCalendar)}>
                    {selectDate.format('YYYY년 MM월 DD일 (dd)')}
                </span>
            </div>
            <button onClick={nextDay} className="text-gray-600 hover:text-gray-800 transition-colors">
                {/* <ChevronRightIcon/> */}
                {'>'}
            </button>

            {isCalendar && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            {/* <ChevronLeftIcon/> */}
                            {'<'}
                        </button>
                        <div className="flex items-center space-x-2">
                            <select
                                value={currentMonth.year()}
                                onChange={handleYearChange}
                                className="font-bold text-lg bg-transparent focus:outline-none cursor-pointer"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}년</option>
                                ))}
                            </select>
                            <span className="font-bold text-lg">{currentMonth.format('MM월')}</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            {/* <ChevronRightIcon/> */}
                            {'>'}
                        </button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
                        <span>일</span>
                        <span>월</span>
                        <span>화</span>
                        <span>수</span>
                        <span>목</span>
                        <span>금</span>
                        <span>토</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {daysInMonth.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => handleDayClick(day)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors
                                  ${day.isSame(currentMonth, 'month') ? 'text-gray-900 hover:bg-blue-100' : 'text-gray-400 cursor-not-allowed'}
                                  ${day.isSame(selectDate, 'day') ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>
                                {day.format('D')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
