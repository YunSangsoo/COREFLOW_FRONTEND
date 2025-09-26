import { useState } from "react";
import { api } from "../../api/coreflowApi";
import styles from './Login.module.css'
import { useNavigate } from "react-router-dom";

const FindPwd = () => {
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const sendTempPwd = async () => {
        try {
            const res = await api.post("/auth/find-pwd", { userName, email });
            alert(res.data);
            navigate("/auth/login")
        } catch (err: any) {
            const message = err.response?.data || "오류가 발생했습니다.";
            alert(message);
        }
    };

    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <h2 className={styles.title}>비밀번호 찾기</h2>
                <form className={styles.form}>
                    <label htmlFor="text" className={styles.label}>이름</label>
                    <input
                        className={styles.input}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                    <label htmlFor="email" className={styles.label}>이메일</label>
                    <input
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="button" className={styles.primaryBtn} onClick={sendTempPwd}>임시 비밀번호 발송</button>
                </form>
            </section>
        </div>
    );
};

export default FindPwd;