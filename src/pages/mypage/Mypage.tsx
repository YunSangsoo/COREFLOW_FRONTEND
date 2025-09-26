import { MemberControll } from "../../components/MemberControll";
import { useMypageForm } from "../../types/MypageForm";
import { useState } from "react";
import { api } from "../../api/vacationApi";
import { useQuery } from "@tanstack/react-query";

type annualLeave = {
    vacAmount: number,
    vacRemaining: number
};

export default function Mypage() {
    const {
        auth,
        phone, setPhone,
        roadAddr, setRoadAddr,
        detailAddr, setDetailAddr,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        isEditingPhone, setIsEditingPhone,
        isEditingPassword, setIsEditingPassword,
        isEditingProfile, setIsEditingProfile,
        isEditingAddress, setIsEditingAddress,
        dbProfile,
        newProfileFile, setNewProfileFile,
        preview, setPreview,
        fileInputRef,
        currentProfileImage,
        handleFileChange,
        handleUpdateProfile,
        handleSearchAddress,
        handleUpdatePhone,
        handleUpdateAddress,
        handleUpdatePassword
    } = useMypageForm();

    const currentYear = new Date().getFullYear();

    const {
        data: vacations = [],
        isLoading,
        isError
    } = useQuery({
        queryKey: ['personalVacation', currentYear],
        queryFn: () => api.get("/vacation/personal", {
            params: { year: currentYear }
        }).then(res => res.data),
    });

    const {
        data: annualLeaveData = { vacAmount: 0, vacRemaining: 0 },
        isLoading: isAnnualLeaveLoading,
        isError: isAnnualLeaveError
    } = useQuery<annualLeave, Error>({
        queryKey: ['availableVacations', currentYear],
        queryFn: () => api.get("/vacation/personal-available", {
            params: { year: currentYear }
        }).then(res => res.data),
    });

    const formatDate = (dateString: string | Date) => {
        // 날짜 문자열(예: '2025-09-23T12:00:00.000+00:00')을 Date 객체로 변환
        const date = new Date(dateString);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;
    const sortedVacations = [...vacations].sort(
        (a, b) => new Date(b.vacStart).getTime() - new Date(a.vacStart).getTime()
    );
    const showVacations = sortedVacations.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );
    const totalPages = Math.max(1, Math.ceil(vacations.length / rowsPerPage));

    return (
        <div className="flex max-w-screen min-w-4/5 max-h-screen min-h-[90vh] gap-y-4 pt-20">
            <div className="flex w-full h-full">
                {/* 정보 수정 */}
                <div className="bg-white shadow-[3px_3px_3px_3px_rgba(75,85,99,0.8)] rounded p-4 gap-3 min-w-[380px] max-w-[420px] w-1/3">
                    <h1 className="text-xl font-bold mb-4">마이페이지</h1>

                    {/* 이름, 이메일 - 조회만 가능 */}
                    <MemberControll label="이름" value={auth.user?.userName ?? ""} isEditing={false} />
                    <MemberControll label="이메일" value={auth.user?.email ?? ""} isEditing={false} />

                    {/* 휴대폰 */}
                    {!isEditingPhone ? (
                        <MemberControll
                            label="휴대폰"
                            value={phone}
                            isEditing={false}
                            children={
                                <button
                                    onClick={() => setIsEditingPhone(true)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    수정
                                </button>
                            }
                        />
                    ) : (
                        <MemberControll
                            label="휴대폰"
                            value={phone}
                            isEditing={true}
                            onChange={e => setPhone(e.target.value)}
                            onSave={handleUpdatePhone}
                            onCancel={() => { setIsEditingPhone(false); setPhone(auth.user?.phone ?? ""); }}
                        />
                    )}

                    {/* 비밀번호 */}
                    {!isEditingPassword ? (
                        <MemberControll
                            label="비밀번호"
                            value="******"
                            isEditing={false}
                            children={
                                <button
                                    onClick={() => setIsEditingPassword(true)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    수정
                                </button>
                            }
                        />
                    ) : (
                        <>
                            <MemberControll
                                label="현재 비밀번호"
                                type="password"
                                value={currentPassword}
                                isEditing={true}
                                onChange={e => setCurrentPassword(e.target.value)}
                            />
                            <MemberControll
                                label="새 비밀번호"
                                type="password"
                                value={newPassword}
                                isEditing={true}
                                onChange={e => setNewPassword(e.target.value)}
                                onSave={handleUpdatePassword}
                                onCancel={() => {
                                    setIsEditingPassword(false);
                                    setCurrentPassword("");
                                    setNewPassword("");
                                }}
                            />
                        </>
                    )}

                    {/* 주소 */}
                    {!isEditingAddress ? (
                        <MemberControll
                            label="주소"
                            value={`${roadAddr} ${detailAddr}`}
                            isEditing={false}
                            children={
                                <button
                                    onClick={() => setIsEditingAddress(true)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    수정
                                </button>
                            }
                        />
                    ) : (
                        <>
                            <MemberControll
                                label="도로명/지번"
                                value={roadAddr}
                                isEditing={true}
                                onChange={e => setRoadAddr(e.target.value)}
                                children={
                                    <button
                                        onClick={handleSearchAddress}
                                        className="px-2 py-1 bg-blue-500 text-white rounded"
                                    >
                                        검색
                                    </button>
                                }
                            />
                            <MemberControll
                                label="상세주소"
                                value={detailAddr}
                                isEditing={true}
                                onChange={e => setDetailAddr(e.target.value)}
                            />
                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={handleUpdateAddress}
                                    className="px-3 py-1 bg-green-500 text-white rounded"
                                >
                                    저장
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingAddress(false);
                                        setRoadAddr(auth.user?.address ?? "");
                                        setDetailAddr(auth.user?.addressDetail ?? "");
                                    }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded"
                                >
                                    취소
                                </button>
                            </div>
                        </>
                    )}

                    {/* 프로필 */}
                    {!isEditingProfile ? (
                        <MemberControll
                            label="프로필"
                            isEditing={false}
                            currentProfileImage={currentProfileImage}
                            children={
                                <>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded"
                                    >
                                        변경
                                    </button>
                                </>
                            }
                        />
                    ) : (
                        <MemberControll label="프로필">
                            <>
                                <img src={currentProfileImage} alt="프로필" className="w-50 h-50 object-cover border mr-2" />
                                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="px-3 py-1 bg-green-500 text-white rounded"
                                    >
                                        저장
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setNewProfileFile(null);
                                            setPreview(null);
                                        }}
                                        className="px-3 py-1 bg-gray-400 text-white rounded"
                                    >
                                        취소
                                    </button>
                                </div>
                            </>
                        </MemberControll>
                    )}
                </div>
                {/* 휴가 정보 */}
                <div className="bg-white shadow-[3px_3px_3px_3px_rgba(75,85,99,0.8)] rounded p-4 gap-3 ml-5 min-w-[760px] max-w-[800px] w-2/3">
                    <div className="flex flex-col flex-shrink-0">
                        <h1 className="text-xl font-bold mb-4">휴가</h1>
                        {/* Use conditional rendering for annual leave data */}
                        {isAnnualLeaveLoading ? (
                            <p>연차 정보를 불러오는 중입니다...</p>
                        ) : isAnnualLeaveError ? (
                            <p className="text-red-500">연차 정보를 가져오는 데 실패했습니다.</p>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-4">
                                    {currentYear}년 지급 연차 수: {annualLeaveData.vacAmount}
                                </h2>
                                <h2 className="text-xl font-bold mb-4">
                                    잔여 연차 수: {annualLeaveData.vacRemaining}
                                </h2>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col flex-shrink-0">
                        <h1 className="text-xl font-bold">휴가 사용 및 신청 내역</h1>
                        <table className="min-w-80 max-w-11/12 text-center border-collapse table-fixed overflow-auto">
                            <thead className="bg-blue-200">
                                <tr>
                                    <th className="px-4 py-2 w-1/2">기간</th>
                                    <th className="px-4 py-2 w-1/6">사용 일 수</th>
                                    <th className="px-4 py-2 w-1/6">휴가 형태</th>
                                    <th className="px-4 py-2 w-1/6">승인 여부</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-4">휴가 정보를 불러오는 중입니다...</td></tr>
                                ) : isError ? (
                                    <tr><td colSpan={4} className="text-center py-4 text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>
                                ) : showVacations.length > 0 ? (
                                    showVacations.map((v) => (
                                        <tr key={v.vacId} className="border-b hover:bg-gray-100">
                                            <td className="px-4 py-2">{formatDate(v.vacStart)} ~ {formatDate(v.vacEnd)}</td>
                                            <td className="px-4 py-2">{v.vacAmount}</td>
                                            <td className="px-4 py-2">{v.vacName}</td>
                                            <td className="px-4 py-2">{v.status === 1 ? '대기' : v.status === 2 ? '승인' : '반려'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center py-4">해당 연도에 신청된 연차가 없습니다.</td></tr>
                                )}
                            </tbody>
                        </table>
                        {/* 페이지네이션 */}
                        <div className="flex justify-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                이전
                            </button>
                            <span className="px-2 py-1">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
