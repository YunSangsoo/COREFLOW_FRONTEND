import { Link } from "react-router-dom";

export default function Unauthorized(){
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
                <h1 className="text-6xl font-extrabold text-red-600 mb-4">403</h1>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">접근 권한 없음</h2>
                <p className="text-gray-600 mb-6">
                    이 페이지에 접근할 수 있는 권한이 없습니다.
                </p>
                <Link to="/" className="inline-block px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-300">
                    메인 페이지로 돌아가기
                </Link>
            </div>
        </div>
    );
}