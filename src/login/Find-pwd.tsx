import { useState } from "react";
import { api } from "../api/coreflowApi";

const FindPwd = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const sendTempPwd = async () => {
        try {
            const res = await api.post("/auth/find-pwd", { name, email });
            setSuccessMessage(res.data);
            setErrorMessage("");
        } catch (err: any) {
            setErrorMessage(err.response?.data || "오류가 발생했습니다.");
            setSuccessMessage("");
        }
    };

    return (
        <div>
            <h2>비밀번호 찾기</h2>
            <input
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendTempPwd}>임시 비밀번호 발송</button>

        {successMessage && <p>{successMessage}</p>}
        {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
};

export default FindPwd;