import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export default function AttSideBar() {
    
    const userRoles = useSelector((state:RootState) => state.auth.user?.roles);
    const hasAccess = userRoles?.includes("ROLE_ADMIN") || userRoles?.includes("ROLE_HR");

    return (
        <div className="flex flex-col w-48">
            {hasAccess && (
                <Link to="/attendance/member" >
                    <button className="w-full py-3 text-center border border-gray-300 mb-1">사원 근태 정보</button>
                </Link>
            )}
            <Link to="/attendance/personal">
                <button className="w-full py-3 text-center border border-gray-300 mb-1">내 근태 정보</button>
            </Link>
        </div>
    )
}