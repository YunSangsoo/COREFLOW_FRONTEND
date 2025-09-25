import { useState } from "react";
import { api } from "../../api/coreflowApi";
import styles from './Login.module.css'

const FindPwd = () => {
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const sendTempPwd = async () => {
        try {
            const res = await api.post("/auth/find-pwd", { userName, email });
            setSuccessMessage(res.data);
            setErrorMessage("");
        } catch (err: any) {
            setErrorMessage(err.response?.data || "오류가 발생했습니다.");
            setSuccessMessage("");
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
                    <button className={styles.primaryBtn} onClick={sendTempPwd}>임시 비밀번호 발송</button>

                    {successMessage && <p>{successMessage}</p>}
                    {errorMessage && <p>{errorMessage}</p>}
                </form>
            </section>
        </div>
    );
};

export default FindPwd;