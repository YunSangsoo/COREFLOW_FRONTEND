import VacSideBar from "../../components/member_vacation/vacSideBar";
import SearchMember from "../../components/member_vacation/SearchMember";
import { useState } from "react";
import type { MemberChoice, MemberVacation } from "../../types/vacation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memVacation, memVacationAll, vacStatusUpdate } from "../../api/vacationApi";
import dayjs from "dayjs";
import VacDate from "../../components/member_vacation/VacDate";

export default function VacationMember() {
    const queryClient = useQueryClient();
    // 사원명 입력값 저장용 훅
    const [searchName, setSearchName] = useState('');

    // input내부 상태 훅
    const [searchQuery, setSearchQuery] = useState('');

    // 선택한 사원 데이터 저장용 훅
    const [selectMember, setSelectMember] = useState<MemberChoice|null>(null);

    // 연도 상태 관리용 훅
    const [selectYear, setSelectYear] = useState(dayjs().year());
    const [selectMonth, setSelectMonth] = useState(dayjs().month() +1);

    // 모든 사원 연차내역 조회용 훅(기본)
    const {data:allVacation, error:allError} = useQuery<MemberVacation[]>({
        queryKey:['allVacation',selectYear, selectMonth],
        queryFn:() => memVacationAll(selectYear,selectMonth)
    })

    // 특정 사원 연차내역 조회용 훅(사원 선택시)
    const {data:memberVacation, error:memberError} = useQuery<MemberVacation[]>({
        queryKey:['memberVacation',selectMember?.userNo, selectYear,selectMonth],
        queryFn:() => {
            if(!selectMember?.userNo){
                return Promise.resolve([]);
            }
            return memVacation(selectMember.userNo,selectYear,selectMonth);
        },
        enabled: !! selectMember
    })

    // 사원 선택 or 선택안함
    const displayData = selectMember ? memberVacation : allVacation;
    const displayError = selectMember ? memberError : allError;

    // 검색 버튼
    const handleSearch = () => {
        setSearchQuery(searchName);
    }

    // 사원 선택시 실행
    const handleSelectMember = (member:MemberChoice) => {
        setSearchName(member.userName);
        setSearchQuery(member.userName);
        setSelectMember(member);
    }

    // 초기화 버튼
    const handleReset = () => {
        setSearchName('');
        setSearchQuery('');
        setSelectMember(null);
    }

    // 날짜 상태 업데이트
    const handleDateChange = (year:number, month?:number) => {
        setSelectYear(year);
        if(month !== undefined){
            setSelectMonth(month);
        }
    }

    // 휴가 상태값 변경
    const mutation = useMutation({
        mutationFn:({vacId, newState}:{vacId:number, newState:number}) => vacStatusUpdate(vacId,newState),
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:['allVacation',selectYear,selectMonth]});
            if(selectMember){
                queryClient.invalidateQueries({queryKey:['memberVacation',selectMember.userNo,selectYear,selectMonth]});
            }
        }
    })

    const handleVacStatusUpdate = (vacId:number, status:number) => {
        const updateStatus = (status % 3) + 1;
        mutation.mutate({vacId,newState:updateStatus});
    }









    return (
        <div className="max-w-4xl mx-auto p-6 bg-white">
            <h1 className="text-2xl font-bold mb-6">연차관리</h1>

            <div className="flex gap-6">
                <VacSideBar />

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

                    <div className="border border-gray-300 rounded overflow-hidden">
                        <div ><VacDate selectYear={selectYear} selectMonth={selectMonth} onDateChange={handleDateChange}/></div>

                        <div className="bg-gray-200 border-b border-gray-300">
                            <div className="flex text-sm font-semibold">
                                <div className="w-12 p-2 border-r border-gray-300 text-center">no</div>
                                <div className="w-12 p-2 border-r border-gray-300 text-center">사원명</div>
                                <div className="w-20 p-2 border-r border-gray-300 text-center">휴가 구분</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">시작일</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">종료일</div>
                                <div className="w-16 p-2 border-r border-gray-300 text-center">휴가 일수</div>
                                <div className="w-16 p-2 text-center">상태</div>
                            </div>
                        </div>

                        <div className="bg-white">
                            {
                                displayData && displayData.length > 0 ? (
                                    displayData.map((item,index) => (
                                    <div key={item.vacId} className="flex text-sm border-b border-gray-200">
                                        <div className="w-12 p-2 border-r border-gray-200 text-center">{index+1}</div>
                                        <div className="w-12 p-2 border-r border-gray-200 text-center">{item.userName}</div>
                                        <div className="w-20 p-2 border-r border-gray-200 text-center">{item.vacName}</div>
                                        <div className="w-24 p-2 border-r border-gray-200 text-center">{dayjs(item.vacStart).format("YYYY-MM-DD")}</div>
                                        <div className="w-24 p-2 border-r border-gray-200 text-center">{dayjs(item.vacEnd).format('YYYY-MM-DD')}</div>
                                        <div className="w-16 p-2 border-r border-gray-200 text-center">{item.vacAmount}</div>
                                        <button
                                            onClick={() => handleVacStatusUpdate(item.vacId, item.status)}
                                            className="w-16 p-2 bg-blue-600 text-center">{item.status===1 ? "대기" : item.status===2 ? "승인" : "반려"}</button>
                                    </div>
                                    ))
                                ) : <div>{displayError?.message}</div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}