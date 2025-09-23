import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notiDelete, notiDetail } from "../../api/noticeApi";
import type { NotiDetail } from "../../types/notice";
import { useState } from "react";
import NoticeInsert from "./NoticeInsert";
import { store } from "../../store/store";

interface NoticeDetailProps {
    notiId: number;
    onClose: () => void;
}

export default function NoticeDetail({ notiId, onClose }: NoticeDetailProps) {
    const queryClient = useQueryClient();
    const loginUser = store.getState().auth.user;

    const [isNoticeInsertOpen, setIsNoticeInsertOpen] = useState(false);

    const openNoticeInsert = () => {
        setIsNoticeInsertOpen(true);
    }
    const closeNoticeInsert = () => {
        setIsNoticeInsertOpen(false);
    }  

    const { data } = useQuery<NotiDetail>({
        queryKey: ['noticeDetail', notiId],
        queryFn: () => notiDetail(notiId),
        enabled: notiId != null
    })

    const deleteMutation = useMutation({
        mutationFn: (notiId: number) => notiDelete(notiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notices'] });
            alert('공지 삭제 완료');
            onClose();
        },
        onError: () => {
            alert('공지 삭제 실패');
        }
    })

    const handleDeleteClick = () => {
        if(window.confirm('공지를 삭제하시겠습니까?')){
            deleteMutation.mutate(notiId);
        }
    }

    if (!data) {
        return null
    }
    console.log(data);
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
                    {data.files?.map((file, index) => (
                            <a 
                            download={file.originName || "download"}
                            href={`${import.meta.env.VITE_API_BASE_URL}/download/${file.imageCode}/${file.changeName}`}
                            key={index} className="text-gray-800">
                                {file.originName}
                                {index < (data.files?.length ?? 0) - 1 && ", "}
                            </a>
                        ))}
                </div>
                {/* )} */}
                
                {loginUser?.userNo === data.writer && (
                    <div className="flex justify-end space-x-4 p-4">
                        <button type="button" onClick={handleDeleteClick} className="rounded-md bg-gray-700 px-6 py-2 text-white hover:bg-gray-800">삭제</button>
                        <button onClick={openNoticeInsert} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">수정</button>
                        {isNoticeInsertOpen && <NoticeInsert initData={data} onClose={closeNoticeInsert}/>}
                    </div>
                )}
            </div>
        </div>
    );
}