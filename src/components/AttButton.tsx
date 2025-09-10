import { useState } from "react";

export default function AttButton() {

    const [attId, setAttId] = useState<number|null>(null);
    
    
    
    
    
    
    
    
    
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