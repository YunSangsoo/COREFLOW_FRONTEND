import type { LoginUser } from "../types/vacation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkIn, checkOut, loginUserAttendance } from "../api/attendanceApi";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { Attendance } from "../types/attendance";

interface AttButtonProps{
    loginUserProfile:LoginUser|undefined;
    loginUserAtt:Attendance[]|undefined;
}
export default function AttButton({loginUserProfile,loginUserAtt}:AttButtonProps) {
    const queryClient = useQueryClient();

    const todayAttendance = Array.isArray(loginUserAtt) ? loginUserAtt?.find(todayAttData => dayjs(todayAttData.attDate).isSame(dayjs(),'day')) : undefined;
    const attId = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime ? todayAttendance.attId : null;

    const checkInMutation = useMutation({
        mutationFn:checkIn,
        onSuccess:() => {
            queryClient.invalidateQueries({ queryKey: ['loginUserAtt', dayjs().year(), dayjs().month() + 1] });
            alert("출근 완료");

        },
        onError:(error)=>{
            console.error("출근 실패 : ",error);
            alert("출근 실패")
        }
    });
    
    const checkOutMutation = useMutation({
        mutationFn:checkOut,
        onSuccess:()=>{
            queryClient.invalidateQueries({ queryKey: ['loginUserAtt', dayjs().year(), dayjs().month() + 1] });
            alert("퇴근 완료");
        },
        onError:(error)=>{
            console.error("퇴근 실패 : ",error);
            alert("퇴근 실패");
        }
    });
    
    const handleCheckIn = () => {
        if(!loginUserProfile){
            alert("로그인 사용자 정보가 없습니다.");
            return;
        }
        const today = dayjs().format('YYYY/MM/DD');
        const now = dayjs().format('HH:mm');
        const isLate = dayjs().isAfter(dayjs().hour(8).minute(0).second(0));
        const status = isLate ? 2 : 1;

        checkInMutation.mutate({
            attDate:today,
            checkInTime:now,
            status : status
        })
    }
    
    const handleCheckOut = () => {
        
        if(!attId){
            alert("출근 전입니다.");
            return;
        }

        const now = dayjs().format("HH:mm");
        console.log(attId, now)
        checkOutMutation.mutate({
            attId:attId,
            checkOutTime:now
        })
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