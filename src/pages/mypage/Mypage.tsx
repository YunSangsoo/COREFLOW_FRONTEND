import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useEffect, useState } from "react";
import { MemberControll } from "../../components/MemberControll";
import { api } from "../../api/coreflowApi";
import { loginSuccess } from "../../features/authSlice";
import type { LoginResponse } from "../../types/type";

export default function Mypage() {
    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    const [phone, setPhone] = useState(auth.user?.phone ?? "");
    const [roadAddr, setRoadAddr] = useState("");
    const [detailAddr, setDetailAddr] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [profile, setProfile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dbProfileUrl, setDbProfileUrl] = useState(auth.user?.profile ?? "/default-profile.png");


    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    const getProfileUrl = (url: string | null) => {
        if (!url) return "/default.png";
        if (url.startsWith("http")) return url; // 절대경로
        if (url.startsWith("/")) return url;    // 상대경로
        return `/images/p/${url}`;              // 파일명만 올 경우
    };

    useEffect(() => {
        api.get("/auth/me")
            .then((res) => {
                // Redux store 갱신 (LoginResponse 그대로)
                dispatch(loginSuccess(res.data));

                // UI 상태 갱신
                setPhone(res.data.user.phone ?? "");
                setRoadAddr(res.data.user.address ?? "");
                setDetailAddr("");
                setDbProfileUrl(res.data.user.profile ?? "/default-profile.png");
            })
            .catch(() => {
                console.error("사용자 정보를 불러오지 못했습니다.");
            });

        // 프로필 미리보기 관리
        if (!profile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(profile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [profile, dispatch]);

    const handleUpdatePhone = () => {
        api.put(`/auth/${auth.user?.userNo}/phone`, { phone })
            .then(() => {
                alert("휴대폰 번호가 수정되었습니다.");
                setIsEditingPhone(false);
            })
            .catch(() => alert("휴대폰 번호 수정 실패"));
    };

    const handleUpdateAddress = () => {
        const fullAddress = `${roadAddr} ${detailAddr}`;
        api.put(`/auth/${auth.user?.userNo}/address`, { address: fullAddress })
            .then(() => {
                alert("주소가 수정되었습니다.")
                setIsEditingAddress(false);
                dispatch(
                    loginSuccess({
                        ...auth.user,
                        address: fullAddress,
                    } as LoginResponse & { address: string })
                );
            })
            .catch(() => alert("주소 수정 실패"));
    };

    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: any) => {
                setRoadAddr(data.address);
                setDetailAddr("");
            },
        }).open();
    };

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword) {
            alert("현재 비밀번호와 새 비밀번호를 모두 입력하세요.");
            return;
        }
        api.put(`/auth/${auth.user?.userNo}/password`, { currentPassword, newPassword })
            .then(() => {
                alert("비밀번호가 변경되었습니다.");
                setIsEditingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
            })
            .catch(() => alert("비밀번호 변경 실패"));
    };

    const handleUpdateProfile = () => {
        if (!profile) return;
        const formData = new FormData();
        formData.append("profile", profile);

        api.put(`/auth/${auth.user?.userNo}/profile`, formData)
            .then((res) => {
                alert("프로필 이미지가 변경되었습니다.");
                setIsEditingProfile(false);
                // 서버에서 반환된 URL로 상태 갱신
                setDbProfileUrl(res.data);

                // 선택한 파일 초기화
                setProfile(null);
                setPreview(null);
            })
            .catch(() => alert("프로필 이미지 업로드 실패"));
    };

    return (
        <div className="max-w-lg mx-auto bg-white shadow rounded p-4">
            <h1 className="text-xl font-bold mb-4">마이페이지</h1>

            {/* 이름/이메일 조회 */}
            <MemberControll title="이름" value={auth.user?.name ?? ""} readOnly />
            <MemberControll title="이메일" value={auth.user?.email ?? ""} readOnly />

            {/* 휴대폰 */}
            {!isEditingPhone ? (
                <MemberControll
                    title="휴대폰"
                    value={phone}
                    readOnly
                    renderAction={
                        <button
                            onClick={() => setIsEditingPhone(true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                        >수정</button>
                    }
                />
            ) : (
                <MemberControll
                    title="휴대폰"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={false}
                    renderAction={
                        <div className="space-x-2">
                            <button
                                onClick={handleUpdatePhone}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                            >저장</button>
                            <button
                                onClick={() => { setIsEditingPhone(false); setPhone(auth.user?.phone ?? ""); }}
                                className="px-3 py-1 bg-gray-400 text-white rounded"
                            >취소</button>
                        </div>
                    }
                />
            )}

            {/* 비밀번호 */}
            {!isEditingPassword ? (
                <MemberControll
                    title="비밀번호"
                    value="******"
                    readOnly
                    renderAction={
                        <button
                            onClick={() => setIsEditingPassword(true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                        >수정</button>
                    }
                />
            ) : (
                <>
                    <MemberControll
                        title="현재 비밀번호"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <MemberControll
                        title="새 비밀번호"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        renderAction={
                            <div className="space-x-2">
                                <button
                                    onClick={handleUpdatePassword}
                                    className="px-3 py-1 bg-green-500 text-white rounded"
                                >저장</button>
                                <button onClick={() => { setIsEditingPassword(false); setCurrentPassword(""); setNewPassword(""); }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded">취소</button>
                            </div>
                        }
                    />
                </>
            )}

            {/* 주소 */}
            {!isEditingAddress ? (
                <MemberControll
                    title="주소"
                    value={roadAddr}
                    readOnly
                    renderAction={
                        <button
                            onClick={() => setIsEditingAddress(true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                        >수정</button>
                    }
                />
            ) : (
                <>
                    <MemberControll
                        title="도로명/지번"
                        value={roadAddr}
                        onChange={(e) => setRoadAddr(e.target.value)}
                        readOnly={false}
                        renderAction={
                            <button
                                onClick={handleSearchAddress}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
                            >주소 검색</button>
                        }
                    />
                    <MemberControll
                        title="상세주소"
                        value={detailAddr}
                        onChange={(e) => setDetailAddr(e.target.value)}
                        readOnly={false}
                        renderAction={
                            <div className="space-x-2">
                                <button
                                    onClick={handleUpdateAddress}
                                    className="px-3 py-1 bg-green-500 text-white rounded"
                                >저장</button>
                                <button onClick={() => {
                                    setIsEditingAddress(false);
                                    setRoadAddr(auth.user?.address ?? "");
                                    setDetailAddr("");
                                }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded"
                                >취소</button>
                            </div>
                        }
                    />
                </>
            )}

            {/* 프로필 이미지 */}
            {!isEditingProfile ? (
                <MemberControll
                    title="프로필"
                    readOnly
                    renderAction={
                        <div className="flex items-center gap-2">
                            <img
                                src={preview ?? getProfileUrl(dbProfileUrl)}
                                alt="프로필"
                                className="w-16 h-16 object-cover border"
                            />
                            <button
                                onClick={() => setIsEditingProfile(true)}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
                            >변경</button>
                        </div>
                    }
                />
            ) : (
                <MemberControll
                    title="프로필"
                    type="file"
                    onChange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0] ?? null;
                        setProfile(file);
                    }}
                    readOnly={false}
                    renderAction={
                        <div className="space-x-2 flex items-center">
                            {profile && (
                                <img
                                    src={
                                        preview
                                            ? preview // 새로 선택한 미리보기
                                            : dbProfileUrl.startsWith("http") // 서버에서 준 URL이면 그대로 사용
                                                ? dbProfileUrl
                                                : `/images/p/${dbProfileUrl}` // DB에 파일명만 있는 경우
                                    }
                                    alt="프로필"
                                    className="w-16 h-16 object-cover border"
                                />
                            )}
                            <button
                                onClick={handleUpdateProfile}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                            >저장</button>
                            <button
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setProfile(null);
                                    setPreview(null);
                                }}
                                className="px-3 py-1 bg-gray-400 text-white rounded"
                            >취소</button>
                        </div>
                    }
                />
            )}
        </div>
    );
};