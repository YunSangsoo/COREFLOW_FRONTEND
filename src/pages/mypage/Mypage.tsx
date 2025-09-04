import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import type { RootState } from "../../store/store";
import { useEffect, useMemo, useState } from "react";
import { MemberControll } from "../../components/MemberControll";
import { api } from "../../api/coreflowApi";

export default function Mypage() {
    const auth = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email, setEmail] = useState(""); // 조회만 가능
    const [name, setName] = useState("");

    const [phone, setPhone] = useState("");
    const [isEditingPhone, setIsEditingPhone] = useState(false);

    const [roadAddr, setRoadAddr] = useState("");
    const [detailAddr, setDetailAddr] = useState("");
    const [origRoadAddr, setOrigRoadAddr] = useState("");
    const [origDetailAddr, setOrigDetailAddr] = useState("");

    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [profile, setProfile] = useState<File | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const addressValid = useMemo(
        () => roadAddr.trim().length > 0 && detailAddr.trim().length > 0,
        [roadAddr, detailAddr]
    );
    const addressDirty = useMemo(
        () => roadAddr !== origRoadAddr || detailAddr !== origDetailAddr,
        [roadAddr, detailAddr, origRoadAddr, origDetailAddr]
    );

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate("/auth/login");
            return;
        }

        api.get("/auth/me")
            .then((res) => {
                const data = res.data;
                setEmail(data.email ?? "");
                setName(data.name ?? "");
                setPhone(data.phone ?? "");
                setProfile(data.profileUrl ?? "");

                // 주소 분리
                if (data.address) {
                    const [road, ...rest] = String(data.address).split(" ");
                    const detail = rest.join(" ");
                    setRoadAddr(road || "");
                    setDetailAddr(detail || "");

                    setOrigRoadAddr(road || "");
                    setOrigDetailAddr(detail || "");
                } else {
                    setOrigRoadAddr("");
                    setOrigDetailAddr("");
                }
            })
            .catch(() => {
                alert("사용자 정보를 불러오지 못했습니다.");
            });
    }, [auth, navigate]);

    const handleUpdatePhone = () => {
        api.put(`/auth/${auth.user?.userNo}/phone`, { phone })
            .then(() => alert("휴대폰 번호가 수정되었습니다."))
            .catch(() => alert("수정 실패"));
    };

    const handleUpdateAddress = () => {
        if (!addressValid) return;
        const fullAddress = `${roadAddr} ${detailAddr}`;
        api.put(`/auth/${auth.user?.userNo}/address`, { address: fullAddress })
            .then(() => {
                alert("주소가 수정되었습니다.")
                setOrigRoadAddr(roadAddr);
                setOrigDetailAddr(detailAddr);
            })
            .catch(() => alert("수정 실패"));
    };

    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: any) => {
                setRoadAddr(data.address);
                setDetailAddr(""); // 상세주소 초기화
            },
        }).open();
    };

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword) {
            alert("현재 비밀번호와 새 비밀번호를 모두 입력하세요.");
            return;
        }
        api.put(`/auth/${auth.user?.userNo}/password`, {
            currentPassword,
            newPassword,
        })
            .then(() => {
                alert("비밀번호가 변경되었습니다.");
                setIsEditingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
            })
            .catch(() => alert("비밀번호 변경 실패"));
    };

    const handleUpdateProfile = () => {
        if (profile) {
            const formData = new FormData();
            formData.append("profileImage", profile);
            setIsEditingProfile(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-white shadow rounded p-4">
            <h1 className="text-xl font-bold mb-4">마이페이지</h1>

            {/* 이메일 - 조회만 가능 */}
            <MemberControll title="이름" value={name} readOnly />
            <MemberControll title="이메일" value={email} readOnly />

            {/* 휴대폰 번호 - 수정 가능 */}
            {!isEditingPhone ? (
                <MemberControll
                    title="휴대폰"
                    value={phone}
                    readOnly
                    renderAction={
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
                    title="휴대폰"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={false}
                    renderAction={
                        <div className="space-x-2">
                            <button
                                onClick={handleUpdatePhone}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                            >
                                저장
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingPhone(false);
                                    setPhone(auth.user?.phone ?? "");
                                }}
                                className="px-3 py-1 bg-gray-400 text-white rounded"
                            >
                                취소
                            </button>
                        </div>
                    }
                />
            )}

            {/* 비밀번호 - 수정 가능 */}
            {!isEditingPassword ? (
                <MemberControll
                    title="비밀번호"
                    value="******"
                    readOnly
                    renderAction={
                        <button
                            type="button"
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
                                    type="button"
                                    onClick={handleUpdatePassword}
                                    className="px-3 py-1 bg-green-500 text-white rounded"
                                >
                                    저장
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingPassword(false);
                                        setCurrentPassword("");
                                        setNewPassword("");
                                    }}
                                    className="px-3 py-1 bg-gray-400 text-white rounded"
                                >
                                    취소
                                </button>
                            </div>
                        }
                    />
                </>
            )}

            {/* 주소 - 수정 가능 */}
            <MemberControll
                title="도로명/지번"
                value={roadAddr}
                onChange={(e) => setRoadAddr(e.target.value)}
                readOnly={false}
                renderAction={
                    <button
                        type="button"
                        onClick={handleSearchAddress}
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                    >
                        주소 검색
                    </button>
                }
            />
            <MemberControll
                title="상세주소"
                value={detailAddr}
                onChange={(e) => setDetailAddr(e.target.value)}
                readOnly={false}
            />
            <div className="mt-2 flex justify-end">
                <button
                    type="button"
                    onClick={handleUpdateAddress}
                    disabled={!addressValid || !addressDirty}
                    className={`rounded px-3 py-1 text-white transition ${!addressValid || !addressDirty
                        ? "cursor-not-allowed bg-gray-300"
                        : "hover:bg-blue-600 bg-blue-500"
                        }`}
                    title={
                        !addressValid
                            ? "도로명/지번과 상세주소를 모두 입력하세요."
                            : !addressDirty
                                ? "변경된 내용이 없습니다."
                                : ""
                    }
                >
                    변경
                </button>
            </div>

            {/* 이미지 - 수정 가능 */}
            <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("profileImage", file);

                    api
                        .post(`/user/${auth.user?.userNo}/profile`, formData)
                        .then((res) => setProfile(res.data.url))
                        .catch(() => alert("이미지 업로드 실패"));
                }}
            />
            {!isEditingProfile ? (
                <MemberControll
                    title="프로필"
                    value={auth.user?.profile ?? ""}
                    readOnly
                    renderAction={
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="px-3 py-1 bg-blue-500 text-white rounded"
                        >
                            변경
                        </button>
                    }
                />
            ) : (
                <MemberControll
                    title="프로필"
                    value=""
                    readOnly={false}
                    renderAction={
                        <div className="space-x-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfile(e.target.files?.[0] ?? null)}
                            />
                            <button
                                onClick={handleUpdateProfile}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                            >
                                저장
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setProfile(null);
                                }}
                                className="px-3 py-1 bg-gray-400 text-white rounded"
                            >
                                취소
                            </button>
                        </div>
                    }
                />
            )}
        </div>
    )
}