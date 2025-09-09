import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/coreflowApi";
import type { RootState } from "../store/store"
import { logout } from "../features/authSlice";

export default function MainPage() {
    const auth = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        api.post("/auth/logout")
            .then(() => {
                dispatch(logout());
                navigate("/");
            })
    };

    return (
        <>
            <div className="flex">
            {
            auth.isAuthenticated ? (
                <>
                <div className="nav-item">
                    <span style={{fontWeight:"bold"}}>
                        {auth.user?.userName} {auth.user?.email}
                    </span>
                </div>
                <div id="logout-button" className="nav-item">
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#DC3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                    로그아웃
                    </button>
                    <button>
                        <Link to="/mypage" className="nav-mypage">마이페이지</Link>
                    </button>
                </div>
                </>
                ) : (
                <div id="login-button">
                    <button>
                        <Link to="/auth/login" className="nav-login">로그인</Link>
                    </button>
                    <button>
                        <Link to="/auth/find-pwd" className="nav-find-pwd">비밀번호 찾기</Link>
                    </button>
                </div>
                )
            }
            </div>
        </>
    )
}