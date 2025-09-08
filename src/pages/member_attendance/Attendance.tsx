import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Attendance } from "../../types/attendance";
import { attInfo } from "../../api/attendanceApi";
import SearchDate from "../../components/member_attendance/SearchDate";
import dayjs from "dayjs";
import AttSideBar from "../../components/member_attendance/attSideBar";
import SearchMember from "../../components/member_vacation/SearchMember";
import type { MemberChoice } from "../../types/vacation";

export default function Attendance () {

    const [searchName, setSearchName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectMember,setSelectMember] = useState<MemberChoice|null>(null);
    const [currentDate, setCurrentDate] = useState(dayjs());
    
    const {data,isLoading,isError,error} = useQuery<Attendance[]>({
        queryKey:['attendance',currentDate.format('YYYY-MM-DD'),selectMember?.userNo],
        queryFn:() => attInfo(currentDate.format('YYYY-MM-DD'),selectMember?.userNo ?? null)
    });

    const handleSearch = () => {
        setSearchQuery(searchName);
    }

    const handleSelectMember = (member:MemberChoice) => {
        setSearchName(member.userName);
        setSearchQuery(member.userName);
        setSelectMember(member);
    }

    const handleReset = () => {
        setSearchName('');
        setSearchQuery('');
        setSelectMember(null);
    }

    if(isLoading) return <div>Loading...</div>
    if(isError) return <div>{error.message}</div>
    
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white">
            <h1 className="text-2xl font-bold mb-6">근태관리</h1>

            <div className="flex gap-6">
                <AttSideBar/>

                <div className="flex-1">
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-center">
                            <div className="px-3 py-1 border bg-gray-800 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">사원명</div>
                            <input 
                                onChange={(e) => setSearchName(e.target.value)} value={searchName} type="text" placeholder="사원명을 입력하세요" 
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                            <button 
                                onClick={handleSearch}
                                className="px-4 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-colors">검색
                            </button>
                            <button 
                                onClick={handleReset}
                                className="px-4 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-colors">초기화
                            </button>
                        </div>
                    </div>
                    {searchQuery && <SearchMember searchName={searchQuery} onSelectMember={handleSelectMember}/>}

                    <div className="border border-gray-300 rounded overctDate={selectDate} onDateChange={setSelectDate}flow-hidden">
                        <SearchDate selectDate={currentDate} onDateChange={setCurrentDate}/>
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
                                data && data.length > 0 ? (
                                    data.map((item,index) => (
                                    <tr className="border-b border-gray-200" key={index}>
                                        <td className="w-12 p-2 border-r border-gray-200 text-center">{index+1}</td>
                                        <td className="w-20 p-2 border-r border-gray-200 text-center">{item.attDate}</td>
                                        <td className="w-24 p-2 border-r border-gray-200 text-center">{item.userName}</td>
                                        <td className="w-24 p-2 border-r border-gray-200 text-center">{item.depName}</td>
                                        <td className="w-16 p-2 border-r border-gray-200 text-center">{item.posName}</td>
                                        <td className="w-16 p-2 border-r border-gray-200 text-center">{item.checkInTime||null}</td>
                                        <td className="w-16 p-2 border-r border-gray-200 text-center">{item.checkOutTime||null}</td>
                                        <td className="w-16 p-2 border-r border-gray-200 text-center">{item.status}</td>
                                    </tr>
                                    ))
                                ):
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-gray-500">근퇴 기록이 없습니다.</td>
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
