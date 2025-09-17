import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Department, DepartmentDetail, Position } from "../../types/member";
import { depDetailList, depList, posList } from "../../api/memberApi";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { notiInsert } from "../../api/noticeApi";
import type { NotiInsert } from "../../types/notice";

interface NoticeInsertProps {
    onClose: () => void;
}

export default function NoticeInsert({ onClose }: NoticeInsertProps) {
    const queryClient = useQueryClient();

    const [noticeForm, setNoticeForm] = useState<NotiInsert>({
        title: '',
        essential: 'F',
        parentDepId: null,
        childDepId: null,
        posId: null,
        endDate: '',
        endTime: '',
        content: '',
    });

    // 부모 부서 조회용 훅
    const { data: parentDep } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: depList
    })

    // 자식 부서 조회용 훅
    const { data: childDep } = useQuery<DepartmentDetail[]>({
    queryKey: ['departmentDetails', noticeForm.parentDepId],
    queryFn: () => {
        // enabled 조건 덕분에 이 함수가 실행될 때 parentDepId는 null이 아님을
        // 타입스크립트에게 강제로 알리는 구문
        return depDetailList(noticeForm.parentDepId!); 
    },
    enabled: noticeForm.parentDepId !== null
});

    // 직위 목록 조회용 훅
    const { data: position } = useQuery<Position[]>({
        queryKey: ['positions'],
        queryFn: posList
    })

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        setNoticeForm(prevForm => {
            // 부서 및 직위 ID는 숫자 또는 null로 처리
            if (name === 'parentDepId' || name === 'childDepId' || name === 'posId') {
                return {
                    ...prevForm,
                    [name]: value ? Number(value) : null,
                };
            }
            // 필수/일반 공지 라디오 버튼 처리
            if (type === 'radio' && name === 'essential') {
                return {
                    ...prevForm,
                    essential: value as 'F' | 'T',
                };
            }
            // 그 외 일반 입력 필드 처리
            return {
                ...prevForm,
                [name]: value,
            };
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // API 호출을 위해 단일 ID를 배열에 담아 전달
        const dataToSubmit: NotiInsert = {
            title: noticeForm.title,
            content: noticeForm.content,
            essential: noticeForm.essential,
            endDate: noticeForm.endDate || undefined,
            endTime: noticeForm.endTime || undefined,
            parentDepId: noticeForm.parentDepId || undefined,
            childDepId: noticeForm.childDepId || undefined,
            posId: noticeForm.posId || undefined,
        };

        insertMutation.mutate(dataToSubmit);
    };

    const insertMutation = useMutation({
        mutationFn: notiInsert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notices'] });
            onClose();
            alert('공지가 등록되었습니다.');
        },
        onError: (error) => {
            console.error("공지 등록 실패 : ", error);
            alert('공지 등록에 실패했습니다.');
        }
    })

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 flex items-center justify-center bg-opacity-50">
            <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
                <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">

                    <div className="flex items-center justify-between bg-gray-100 p-4">
                        <h2 className="text-xl font-bold">공지사항</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <label className="w-24 font-semibold text-gray-700">제 목 :</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={noticeForm.title}
                                    onChange={handleChange}
                                    className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                />
                                <div className="ml-4 flex items-center space-x-4 text-gray-700">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="noticeType"
                                            value="F"
                                            checked={noticeForm.essential === 'F'}
                                            onChange={handleChange}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">일반</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="noticeType"
                                            value="T"
                                            checked={noticeForm.essential === 'T'}
                                            onChange={handleChange}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">필독</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-24 font-semibold text-gray-700">공지 부서 :</label>
                                <div className="relative">
                                    <select
                                        name="parentDepId"
                                        value={noticeForm.parentDepId || ''}
                                        onChange={handleChange}
                                        className="appearance-none rounded-md border border-gray-300 bg-white p-2 pr-8 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">전체</option>
                                        {parentDep?.map((dep) => (
                                            <option key={dep.depId} value={dep.depId}>{dep.depName}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.243 4.243z" /></svg>
                                    </div>
                                </div>
                                <label className="w-24 font-semibold text-gray-700">상세 부서 :</label>
                                <div className="relative">
                                    <select
                                        name="childDepId"
                                        value={noticeForm.childDepId || ''}
                                        onChange={handleChange}
                                        disabled={!noticeForm.parentDepId}
                                        className="appearance-none rounded-md border border-gray-300 bg-white p-2 pr-8 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">전체</option>
                                        {childDep?.map((dep) => (
                                            <option key={dep.depId} value={dep.depId}>{dep.depName}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.243 4.243z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="w-24 font-semibold text-gray-700">공지 직위 :</label>
                                <div className="relative">
                                    <select
                                        name="posId"
                                        value={noticeForm.posId || ''}
                                        onChange={handleChange}
                                        className="appearance-none rounded-md border border-gray-300 bg-white p-2 pr-8 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">전체</option>
                                        {position?.map((pos) => (
                                            <option key={pos.posId} value={pos.posId}>{pos.posName}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.243 4.243z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <label className="w- font-semibold text-gray-700">마감 기간 :</label>
                                <div className="relative">
                                    <div className="flex items-center space-x-2">
                                        <div className="relative w-40">
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={noticeForm.endDate}
                                                onChange={handleChange}
                                                className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 12h14M5 16h14M5 20h14" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <label className="w-24 font-semibold text-gray-700">마감 시간 :</label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={noticeForm.endTime}
                                        onChange={handleChange}
                                        className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.243 4.243z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-gray-700">내용</label>
                                <textarea
                                    name="content"
                                    value={noticeForm.content}
                                    onChange={handleChange}
                                    className="mt-1 h-48 w-full resize-none rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                    placeholder=""
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center">
                            <span className="font-semibold text-gray-700">첨부 :</span>
                            <button className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200">
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 bg-gray-100 p-4">
                        <button type="submit" className="rounded-md bg-gray-700 px-6 py-2 text-white hover:bg-gray-800">등록</button>
                    </div>
                </div>
            </div>
        </form>
    );
}