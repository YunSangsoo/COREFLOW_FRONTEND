import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { api } from "../api/coreflowApi";
import { loginSuccess } from "../features/authSlice";
import type { customFile } from "./type";

export const useMypageForm = () => {
    const auth = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();

    // 상태
    const [phone, setPhone] = useState("");
    const [roadAddr, setRoadAddr] = useState("");
    const [detailAddr, setDetailAddr] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [dbProfile, setDbProfile] = useState<customFile | null>(null);
    const [dbProfileUrl, setDbProfileUrl] = useState<string>("/default.png");
    const [newProfileFile, setNewProfileFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 프로필 이미지 URL 처리
    const getProfileUrl = (file: customFile | null): string => {
        if (!file) return `${import.meta.env.VITE_API_BASE_URL}/images/p/default.png`;
        return `${import.meta.env.VITE_API_BASE_URL}/images/${file.imageCode}/${file.changeName}`;
    };

    // 사용자 정보 초기 로드
    useEffect(() => {
        api.get("/auth/me")
            .then(res => {
                dispatch(loginSuccess(res.data));
                setPhone(res.data.user.phone ?? "");
                setRoadAddr(res.data.user.address ?? "");
                setDetailAddr(res.data.user.addressDetail ?? "");

                const profile = res.data.user.profile;
                if (profile && typeof profile === "object") {
                    setDbProfileUrl(getProfileUrl(res.data.user.profile));
                } else if (profile && typeof profile === "string") {
                    setDbProfileUrl(res.data.user.profile);
                } else {
                    setDbProfileUrl(`${import.meta.env.VITE_API_BASE_URL}/images/p/default.png`);
                }
            })
            .catch(() => console.error("사용자 정보를 불러오지 못했습니다."));
    }, [dispatch]);

    // 파일 선택 시 미리보기
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewProfileFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    // 프로필 업데이트
    const handleUpdateProfile = () => {
        if (!newProfileFile) return alert("업데이트할 프로필 이미지를 선택해주세요.");
        const formData = new FormData();
        formData.append("profile", newProfileFile);

        api.put(`/auth/${auth.user?.userNo}/profile`, formData)
            .then(res => {
                const profile = res.data.profile as customFile;
                setDbProfile(profile); // 새 프로필 세팅
                setNewProfileFile(null);
                setPreview(`${import.meta.env.VITE_API_BASE_URL}/images/${profile.imageCode}/${profile.changeName}`);
                setIsEditingProfile(false);

                alert("프로필 이미지가 변경되었습니다.");
            })
            .catch(() => alert("프로필 이미지 업로드 실패"));
    };
    const currentProfileImage = preview || dbProfileUrl;

    // 주소 검색
    const handleSearchAddress = () => {
        new window.daum.Postcode({
            oncomplete: (data: any) => {
                setRoadAddr(data.address);
                setDetailAddr(data.addressDetail || "");
            },
        }).open();
    };

    // 휴대폰, 주소, 비밀번호 업데이트
    const handleUpdatePhone = () => {
        if (!phone) return alert("휴대폰 번호를 입력해주세요.");
        api.put(`/auth/${auth.user?.userNo}/phone`, { phone })
            .then(() => { alert("휴대폰 번호가 수정되었습니다."); setIsEditingPhone(false); })
            .catch(() => alert("휴대폰 번호 수정 실패"));
    };

    const handleUpdateAddress = () => {
        api.put(`/auth/${auth.user?.userNo}/address`, { address: roadAddr, addressDetail: detailAddr })
            .then(() => { alert("주소가 수정되었습니다."); setIsEditingAddress(false); })
            .catch(() => alert("주소 수정 실패"));
    };

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword) return alert("현재 비밀번호와 새 비밀번호를 모두 입력하세요.");
        api.put(`/auth/${auth.user?.userNo}/password`, { currentPassword, newPassword })
            .then(() => {
                alert("비밀번호가 변경되었습니다.");
                setIsEditingPassword(false);
                setCurrentPassword("");
                setNewPassword("");
            })
            .catch(() => alert("비밀번호 변경 실패"));
    };

    return {
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
    };
};
