import { useState } from "react";
import VacSideBar from "../../components/member_vacation/vacSideBar";

export default function VacationMember() {
    // 검색어 저장용 훅
    const [searchName, setSearchName] = useState('');



















    const handleReset = () => {

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
                            <input type="text" placeholder="사원명을 입력하세요" className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                            <button className="px-4 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-colors" onClick={handleReset}>초기화</button>
                        </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-6">
                                <div className="text-sm">
                                    <span className="font-semibold">사원번호:</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">이름:</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">부서:</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold">직위:</span>
                                </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">????년 연차 내역</div>
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded overflow-hidden">
                        <div className="bg-gray-100 border-b border-gray-300 p-2 text-center font-semibold">???? 년</div>

                        <div className="bg-gray-200 border-b border-gray-300">
                            <div className="flex text-sm font-semibold">
                                <div className="w-12 p-2 border-r border-gray-300 text-center">no</div>
                                <div className="w-20 p-2 border-r border-gray-300 text-center">휴가 구분</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">시작일</div>
                                <div className="w-24 p-2 border-r border-gray-300 text-center">종료일</div>
                                <div className="w-16 p-2 border-r border-gray-300 text-center">휴가 일수</div>
                                <div className="w-16 p-2 text-center">상태</div>
                            </div>
                        </div>

                        <div className="bg-white">
                            {

                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}