import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { logout } from '../features/authSlice';
import { api } from '../api/coreflowApi';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const location = useLocation();
  
  // ✅ 2. 현재 경로가 메인 페이지('/')인지 확인합니다.
  const isMainPage = location.pathname === '/';
  
  // Redux store에서 현재 인증 상태와 사용자 정보를 가져옵니다.
  const auth = useSelector((state: RootState) => state.auth);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      // 백엔드에 로그아웃 요청을 보냅니다 (세션/토큰 무효화).
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // API 요청 성공 여부와 관계없이 프론트엔드에서는 로그아웃 처리
      dispatch(logout());
      navigate('/auth/login'); // 로그인 페이지로 리디렉션
    }
  };

  return (
    <header 
      className={`w-full p-4 flex justify-end items-center shadow-sm text-md bg-gray-800`}
    >
      {auth.accessToken && auth.user ? (
        // 로그인 상태일 때 표시될 UI
        <div className="flex items-center space-x-4">
          <span className={`hover:underline${
                isMainPage ? 'text-grey-200' : 'text-gray-600'
            }`}>
            <span className="font-semibold">{auth.user.userName}</span>
            <span className="ml-1">({auth.user.email})</span>
          </span>
          <Link 
            to="/mypage" 
            className={`hover:underline${
                isMainPage ? 'text-white' : 'text-gray-700'
            }`}
          >
            마이페이지
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600"
          >
            로그아웃
          </button>
        </div>
      ) : (
        // 로그아웃 상태일 때 표시될 UI (예시)
        <div>
          <Link 
            to="/auth/login" 
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600"
          >
            로그인
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;