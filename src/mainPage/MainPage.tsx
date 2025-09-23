import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/coreflowApi";
import type { RootState } from "../store/store"
import { logout } from "../features/authSlice";
import NoticeMain from "../components/notice/NoticeMain";
import { useState } from "react";
import { menuItems } from "../types/menuItems";
import Header from "../components/Header";
import { selectTotalUnreadCount } from "../features/chatSlice";

interface MainPageProps {
    onChatClick: () => void;
}

export default function MainPage({ onChatClick }: MainPageProps) {
    const auth = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const handleCardClick = (item: any) => {
        if (item.path) {
            navigate(item.path);
        }
        if (item.action === 'chat') {
            onChatClick();
        }
        if ( item.action === 'notice') {
            openNoticeModal();
        }
        if (item.subItems) {
            setOpenCard(openCard === item.name ? null : item.name);
        }
    // 하위 메뉴가 있는 그룹 카드는 클릭해도 아무 동작 안 하도록 설정
    };

    const [openCard, setOpenCard] = useState<string | null>('');
    const [isNoticeMainOpen, setIsNoticeMainOpen] = useState(false);
    const totalUnreadCount = useSelector(selectTotalUnreadCount);

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
            <div className="fixed top-0 left-0 w-screen flex flex-col justify-between bg-gray-800 text-white h-32">
                <p className="p-4 font-bold text-5xl">CoreFlow</p>
                <Header />
            </div>
            
            <div className="p-8 mt-36">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {menuItems.map((item) => (
                    // 하위 메뉴가 있는 항목은 그룹 카드로 렌더링
                    item.subItems ? (
                        <div 
                            key={item.name} 
                            className={openCard===item.name ? "bg-gray-100 p-8 rounded-lg shadow-lg col-span-1 md:col-span-2 lg:col-span-4":
                                'bg-gray-100 p-8 m-3 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer'
                            }
                        >
                        <div 
                            onClick={() => handleCardClick(item)}
                            className="flex justify-between items-center cursor-pointer"
                        >
                        <div>
                        <h2 className="text-2xl font-semibold text-gray-700">{item.name}</h2>
                        {openCard !== item.name && (
                            <p className="text-gray-500 mt-2 text-sm">열기</p>
                        )}
                        </div>
                    </div>
                    {openCard === item.name && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {item.subItems.map(subItem => (
                        <Link to={subItem.path || '#'} key={subItem.name} className="block p-8 text-xl bg-gray-200 rounded hover:bg-gray-300 transition-colors">
                            {subItem.name}
                            <p className="text-gray-500 mt-2 text-sm">바로가기</p>
                        </Link>
                        ))}
                    </div>
                        )}
                    </div>
                    ) : (
                    // 단일 항목은 일반 카드로 렌더링
                    <div
                        key={item.name}
                        onClick={() => handleCardClick(item)}
                        className={`bg-gray-100 p-8 m-3 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer
                            ${item.action === 'chat' && totalUnreadCount > 0 ? 'border-2 border-red-400 ring-4 ring-red-100' : ''}
                            `}
                        >
                        <h2 className="text-2xl font-semibold text-gray-700">{item.name}</h2>
                        {item.action === 'chat' && totalUnreadCount > 0 && (
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        <p className="text-gray-500 mt-2 text-sm">바로가기</p>
                    </div>
                    )
                ))}
                </div>
            </div>
            {isNoticeMainOpen && <NoticeMain onClose={closeNoticeModal}/>}
        </>
    )
}