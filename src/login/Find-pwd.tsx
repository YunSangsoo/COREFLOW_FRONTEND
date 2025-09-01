import { useState } from "react";
import axios from "axios";

const FindPwd = () => {
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [success, setSuccess] = useState(false);

    const requestReset = async () => {
        try {
            const res = await axios.post("/auth/reset-password", { userId, email });
            setResetToken(res.data.resetToken);
        } catch (err: any) {
            console.error(err);
        }
    };

    const changePassword = async () => {
        if (!resetToken) return;
        try {
            await axios.post("/auth/change-password", { resetToken, newPassword });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2>비밀번호 찾기</h2>
            {!resetToken ? (
                <>
                <input
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                />
                <input
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={requestReset}>비밀번호 재설정 요청</button>
            </>
        ) : (
            <>
                <input
                    placeholder="새 비밀번호"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={changePassword}>비밀번호 변경</button>
            </>
        )}

        {success && <p>비밀번호가 성공적으로 변경되었습니다.</p>}
        </div>
    );
};

export default FindPwd;