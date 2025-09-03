import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";


export default function ChatPopup() {
    const auth = useSelector((state:RootState) => state.auth);

    return (
        <>
            {auth.isAuthenticated ?(
                <button className="bg-sky-500 hover:bg-sky-700">채팅</button>
            ):null
            }
        </>
    )
}