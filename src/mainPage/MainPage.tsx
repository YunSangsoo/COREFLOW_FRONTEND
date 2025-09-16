import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/coreflowApi";
import type { RootState } from "../store/store"
import { logout } from "../features/authSlice";
import NoticeMain from "../components/notice.tsx/NoticeMain";
import { useState } from "react";

export default function MainPage() {
    const auth = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isNoticeMainOpen, setIsNoticeMainOpen] = useState(false);

    const handleLogout = () => {
        api.post("/auth/logout")
            .then(() => {
                dispatch(logout());
                navigate("/");
            })
    };

    const openNoticeModal = () => {
        setIsNoticeMainOpen(true);
    }

    const closeNoticeModal = () => {
        setIsNoticeMainOpen(false);
    }

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
            <div
                onClick={openNoticeModal} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-bold"> 공지 썸네일이 될 공간
            </div>
                {isNoticeMainOpen && <NoticeMain onClose={closeNoticeModal}/>}
        </>
    )
}