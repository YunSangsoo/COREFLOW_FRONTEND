import { Link } from "react-router-dom";

export default function VacSideBar() {

    return (
        <div className="flex flex-col w-48">
                <Link to="/vacation/info" >
                    <button className="px-4 py-2 text-left border border-gray-300 mb-1" >기본 연차 관리</button>
                </Link>
                <Link to="/vacation/member">
                    <button className="px-4 py-2 text-left border border-gray-300 mb-1">사원 연차 관리</button>
                </Link>
                <Link to="/vacation/personal">
                    <button className="px-4 py-2 text-left border border-gray-300 mb-1">내 연차 관리</button>
                </Link>
        </div>
    )
}
