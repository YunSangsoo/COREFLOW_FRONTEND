import { MemberControll } from "../../components/MemberControll";
import { useMypageForm } from "../../types/MypageForm";

export default function Mypage() {
    const {
        auth,
        phone, setPhone,
        roadAddr, setRoadAddr,
        detailAddr, setDetailAddr,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        profile, setProfile,
        isEditingPhone, setIsEditingPhone,
        isEditingPassword, setIsEditingPassword,
        isEditingAddress, setIsEditingAddress,
        isEditingProfile, setIsEditingProfile,
        currentProfileImage,
        handleFileChange,
        handleUpdatePhone,
        handleUpdatePassword,
        handleUpdateAddress,
        handleUpdateProfile,
        handleSearchAddress
    } = useMypageForm();

    return (
        <div className="max-w-lg mx-auto bg-white shadow rounded p-4">
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
                    label="도로명/지번"
                    value={roadAddr}
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
                    value=""
                    isEditing={false}
                    children={
                        <>
                            <img src={currentProfileImage} alt="프로필" className="w-16 h-16 object-cover border mr-2" />
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
                        <img src={currentProfileImage} alt="프로필" className="w-16 h-16 object-cover border mr-2" />
                        <input type="file" accept="image/*" onChange={handleFileChange} />
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
                                    setProfile(null);
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
    );
}
