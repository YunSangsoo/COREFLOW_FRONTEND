import { useQuery } from "@tanstack/react-query";
import { notiDetail } from "../../api/noticeApi";
import type { NotiDetail } from "../../types/notice";

interface NoticeDetailProps {
    notiId: number;
    onClose: () => void;
}

export default function NoticeDetail({ notiId, onClose }: NoticeDetailProps) {

    const { data } = useQuery<NotiDetail>({
        queryKey: ['noticeDetail', notiId],
        queryFn: () => notiDetail(notiId),
        enabled: notiId != null
    })

    if (!data) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-4xl p-6 border border-black">

                <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                    <h2 className="text-2xl font-semibold">공지사항</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none">
                        &times;
                    </button>
                </div>

                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2 col-span-2">
                        <span className="font-bold mb-5 text-gray-700">제목 :
                            {data?.essential === 'T' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    필독
                                </span>
                            )}
                            {data?.title}
                        </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 text-sm text-gray-800">
                        <span className="font-bold text-gray-700">작성자 : {data?.userName} |</span>
                        <span className="font-bold text-gray-700">부서 : {data?.depName} |</span>
                        <span className="font-bold text-gray-700">직위 : {data?.posName} |</span>

                        {
                            data.updateDate ?
                                <span className="font-bold text-gray-700">수정일 : {new Date(data.updateDate).toLocaleDateString()}</span>
                                :
                                <span className="font-bold text-gray-700">작성일 : {new Date(data.enrollDate).toLocaleDateString()}</span>
                        }

                    </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200 min-h-[150px]">
                    <p className="text-gray-800 whitespace-pre-wrap">{data?.content}</p>
                </div>

                {/* {data?.attachments && data?.attachments.length > 0 && ( */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <span className="font-bold text-gray-700">첨부 : </span>
                    {/* {data.attachments.map((file, index) => (
                            <span key={index} className="text-gray-800">
                                {file.fileName}
                                {index < data.attachments.length - 1 && ", "}
                            </span>
                        ))} */}
                </div>
                {/* )} */}
            </div>
        </div>
    );
}