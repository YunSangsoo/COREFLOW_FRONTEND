import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css'
import { AxiosError } from 'axios';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/authSlice';
import { api } from '../../api/coreflowApi';

export default function Login() {
    const navigate = useNavigate();
    // 입력 상태
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // 요청 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!email.trim() || !password.trim()){
            setError("이메일과 비밀번호 모두 입력하세요!");
            return;
        }
        setLoading(true);
        setError("");

        api
        .post("/auth/login", {email, password})
        .then(res => {
            console.log(res.data);
            dispatch(loginSuccess(res.data));
            console.log("로그인 디스패치 : ", loginSuccess(res.data));
            navigate("/", {state:{flash:"로그인 성공"}});
        })
        .catch((err:AxiosError) => {
            if(err.response?.status === 404){
                const doSignup = confirm("등록된 계정이 없습니다.");
                if(!doSignup){
                    setError("계정을 다시 확인해주세요");
                    setLoading(false);
                    return;
                }
            }
            else if(err.response?.status){
                setError("비밀번호가 잘못입력되었습니다");
            }else{
                setError("로그인 처리중 오류 발생했습니다")
            }           

        }).finally(() => {
                    setLoading(false);
                })
    };

    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <h2 className={styles.title}>로그인</h2>
                <form onSubmit={handleLogin} className={styles.form}>
                    <label htmlFor="email" className={styles.label}>
                        이메일
                    </label>
                    <input
                        id="email"
                        type="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        autoComplete="email"
                    />
                    <label htmlFor="password" className={styles.label}>
                        비밀번호
                    </label>
                    <input
                        id="password"
                        type="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=""
                        autoComplete="current-password"
                    />
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                        {loading ? "로그인 중…" : "로그인"}
                    </button>
                    {error && <p className={styles.error}>{error}</p>}
                </form>
                <div className={styles.dividerWrap}>
                    <div className={styles.divider} />
                    <span className={styles.dividerText}>또는</span>
                    <div className={styles.divider} />
                </div>
            </section>
        </div>
    )
}