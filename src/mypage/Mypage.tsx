import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import type { RootState } from "../store/store";
import { useState } from "react";
import { MemberControll } from "../components/MemberControll";

export default function Mypage() {
    const auth = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [email] = useState(""); // 조회만 가능
    const [name] = useState("");
    const [phone, setPhone] = useState(""); // 수정 가능
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [profile, setProfile] = useState("");

    return (
        <div className="max-w-lg mx-auto bg-white shadow rounded p-4">
            <h1 className="text-xl font-bold mb-4">마이페이지</h1>

            {/* 이메일 - 조회만 가능 */}
            <MemberControll title="이름" value={name} readOnly />
            <MemberControll title="이메일" value={email} readOnly />

            {/* 휴대폰 번호 - 수정 가능 */}
            <MemberControll
                title="휴대폰"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={false}
                renderAction={
                    <button className="px-3 py-1 bg-blue-500 text-white rounded">
                        수정
                    </button>
                }
            />

            {/* 비밀번호 - 수정 가능 */}
            <MemberControll
                title="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                readOnly={false}
                renderAction={
                    <button className="px-3 py-1 bg-blue-500 text-white rounded">
                        수정
                    </button>
                }
            />

            {/* 주소 - 수정 가능 */}
            <MemberControll
                title="주소"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                readOnly={false}
                renderAction={
                    <button className="px-3 py-1 bg-blue-500 text-white rounded">
                        수정
                    </button>
                }
            />

            {/* 이미지 - 수정 가능 */}
            
            
        </div>
    )
}