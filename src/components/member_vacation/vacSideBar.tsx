import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../store/store";

export default function VacSideBar() {
    
    const userRoles = useSelector((state:RootState) => state.auth.user?.roles);
    const hasAccess = userRoles?.includes("ROLE_ADMIN") || userRoles?.includes("ROLE_HR");

    return (
        <div className="flex flex-col w-48">
                <Link to="/vacation/info" >
                    <button className="w-full py-3 text-center border border-gray-300 mb-1">기본 연차 정보</button>
                </Link>
                {hasAccess && (
                    <Link to="/vacation/member">
                        <button className="w-full py-3 text-center border border-gray-300 mb-1">사원 휴가 정보</button>
                    </Link>
                )}
                <Link to="/vacation/personal">
                    <button className="w-full py-3 text-center border border-gray-300 mb-1">내 휴가 정보</button>
                </Link>
        </div>
    )
}
