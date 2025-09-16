import type { chatProfile } from "../../types/chat"

interface chatRoomUserInfoProps{
  users: chatProfile[];
  onOpenProfile:(user: chatProfile) =>void;
}

export const ChatRoomUserInfo = ({users,onOpenProfile}:chatRoomUserInfoProps) => {
    return (
        <div className="flex flex-col h-full">
            <ul className="flex-grow space-y-1 p-2 overflow-y-auto">
                {users.map((user) => (
                    <li 
                    key={user.userNo}
                    onClick={() => onOpenProfile(user)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-sky-200 cursor-pointer"
                    >
                    <div className="flex items-center space-x-2">
                        <img 
                        src={`${import.meta.env.VITE_API_BASE_URL}/images/${user.profile.imageCode}/${user.profile.changeName}`}
                        className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></img>
                        <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-gray-500">{user.status}</p>
                        </div>
                    </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}