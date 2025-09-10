import { Link } from "react-router-dom";

export default function AttSideBar() {
    return (
        <div className="flex flex-col w-48">
                <Link to="/attendance/member" >
                    <button className="w-full py-3 text-center border border-gray-300 mb-1">사원 근태 정보</button>
                </Link>
                <Link to="/attendance/personal">
                    <button className="w-full py-3 text-center border border-gray-300 mb-1">내 근태 정보</button>
                </Link>
        </div>
    )
}
