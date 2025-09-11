import type { LoginUser } from "../types/vacation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkIn } from "../api/attendanceApi";

interface AttButtonProps{
    loginUserProfile:LoginUser|undefined;
    attId:number|null;
    setAttId:(id:number|null) => void;
}
export default function AttButton({loginUserProfile, attId, setAttId}:AttButtonProps) {
    const queryClient = useQueryClient();

    const checkInMutation = useMutation({
        mutationFn:checkIn,
        onSuccess:(data) => {
            setAttId(data.attId);
            queryClient.invalidateQueries({queryKey:['loginUserAtt']});
            alert("출근완료");
        },
        onError:(error)=>{
            console.error("출근실패",error);
            alert("출근실패")
        }
    });
    
    const checkOutMutation = useMutation({

    });
    
    
    
    
    
    
    const handleCheckIn = () => {

    }
    
    const handleCheckOut = () => {

    }
    
    return(
        <div>
            {
                attId === null ? (
                    <button onClick={handleCheckIn}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                        출근
                    </button>
                ) : (
                    <button onClick={handleCheckOut}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                        퇴근
                    </button>
                )
            }
        </div>
    )
}