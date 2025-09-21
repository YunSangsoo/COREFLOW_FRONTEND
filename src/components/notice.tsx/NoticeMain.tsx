import { useQuery } from "@tanstack/react-query";
import type { NoticeResponse, SearchParams } from "../../types/notice";
import { notiList } from "../../api/noticeApi";
import { useState } from "react";
import NoticeDetail from "./NoticeDetail";
import NoticeInsert from "./NoticeInsert";
import { store } from "../../store/store";

interface NoticeMainProps{
    onClose : () => void;
}

export default function NoticeMain({onClose} : NoticeMainProps) {
    const user = store.getState().auth.user;

    const [isNoticeInsertOpen, setIsNoticeInsertOpen] = useState(false);
    
    const [isNoticeDetailOpen, setIsNoticeDetailOpen] = useState(false);
    const [selectedNoticeId, setSelectedNoticeId] = useState<number|null>(null);

    const openNoticeInsert = () => {
        setIsNoticeInsertOpen(true);
    }

    const closeNoticeInsert = () => {
        setIsNoticeInsertOpen(false);
    }

    const openNoticeDetail = (notiId:number) => {
        setSelectedNoticeId(notiId);
        setIsNoticeDetailOpen(true);
    }

    const closeNoticeDetail = () => {
        setSelectedNoticeId(null);
        setIsNoticeDetailOpen(false);
    }

    const [inputParams, setInputParams] = useState<SearchParams>({
        searchType:"title",
        keyword:"",
    })

    const [searchParams, setSearchParams] = useState<SearchParams>({
        searchType:"title",
        keyword:"",
        depId:user?.depId,
        posId:user?.posId
    });

    const { data: noticeList } = useQuery<NoticeResponse[]>({
        queryKey: ['notices',searchParams],
        queryFn: () => notiList(searchParams)
    })

    const handleInputChange = (e:React.ChangeEvent<HTMLSelectElement|HTMLInputElement>) => {
        const {name, value} = e.target;
        setInputParams(prev => ({
            ...prev,[name]:value
        }))
    }
    const handleSearch = () => {
        setSearchParams(inputParams);
    }

    const handleReset = () => {
        const resetParams = {searchType:"title", keyword:""} as SearchParams;
        setInputParams(resetParams);
        setSearchParams(resetParams);
    }
    return (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-4xl p-6 border border-black">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">공지 조회</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none">
                        &times;
                    </button>
                </div>
                <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-2">
                        <select
                            name="searchType" value={inputParams.searchType} onChange={handleInputChange} 
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-bold">
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="writer">작성자</option>
                        </select>
                        <input
                            type="text" name="keyword" value={inputParams.keyword} onChange={handleInputChange}
                            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-bold">검색</button>
                        <button onClick={handleReset} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-bold">초기화</button>
                        <button onClick={openNoticeInsert} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">등록</button>
                    </div>
                </div>
                <div className="border border-gray-200 rounded-md overflow-hidden overflow-y-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">작성자</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">제목</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">작성일</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {noticeList && noticeList.map((notice,index) => (
                                <tr key={notice.notiId} onDoubleClick={() => openNoticeDetail(notice.notiId)} className="hover:bg-gray-100 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap">{index+1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{notice.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {notice.essential === 'T' && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mr-2">
                                                필독
                                            </span>)
                                        }
                                    {notice.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(notice.enrollDate).toLocaleDateString()}
                                    </td>
                                </tr>))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            {isNoticeInsertOpen && <NoticeInsert onClose={closeNoticeInsert}/>}
            {isNoticeDetailOpen && selectedNoticeId !== null && (<NoticeDetail notiId={selectedNoticeId} onClose={closeNoticeDetail}/>)}
        </div>
    );
};