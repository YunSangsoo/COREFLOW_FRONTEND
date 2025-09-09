import { useState } from "react";
import axios from "axios";

const FindId = () => {
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleFindId = async () => {
        try {
            const res = await axios.post("/auth/find-id", { email });
            setUserId(res.data.userId);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || "아이디를 찾을 수 없습니다.");
            setUserId(null);
        }
    };

    return (
        <div>
            <h2>아이디 찾기</h2>
            <input
                type="email"
                placeholder="이메일 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleFindId}>찾기</button>

            {userId && <p>회원님의 아이디: {userId}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default FindId;