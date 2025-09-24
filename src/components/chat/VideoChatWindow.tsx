import { useEffect, useRef } from "react";
import type { chatProfile, SignalMessage, SignalType } from "../../types/chat";
import { sendSignal } from '../../api/webSocketApi';
import { XIcon } from "./SvgSettingIcon";

interface VideoChatWindowProps {
  myProfile: chatProfile;
  partnerProfile: chatProfile;
  initialOffer?: any; // 통화를 '받는' 경우, 최초 offer를 받음
  onHangUp: () => void; // 통화 종료 콜백
  registerSignalHandler: (partnerNo: number, handler: (signal: SignalMessage) => void) => void;
  unregisterSignalHandler: (partnerNo: number) => void;
}

export const VideoChatWindow = ({ myProfile, partnerProfile, initialOffer, onHangUp,  registerSignalHandler,unregisterSignalHandler  }: VideoChatWindowProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);


    useEffect(() => {
    // 1. WebRTC Peer Connection 생성 및 설정
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // Google의 공개 STUN 서버
    });
    peerConnectionRef.current = pc;

    // a. ICE Candidate가 수집되었을 때
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice', event.candidate, myProfile, partnerProfile);
      }
    };

    // b. 상대방의 미디어 스트림이 도착했을 때
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const handleSignal = (signal: SignalMessage) => {
      if (!pc) return;
      if (signal.type === 'answer' && pc.signalingState !== 'stable') {
        pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      } else if (signal.type === 'ice') {
        pc.addIceCandidate(new RTCIceCandidate(signal.data));
      }
    };
    // 2. ChatManager에 이 핸들러 함수를 '등록'합니다.
    // "파트너(partnerProfile.userNo)로부터 오는 신호는 이(handleSignal) 함수로 처리해주세요"
    registerSignalHandler(partnerProfile.userNo, handleSignal);

// --- 미디어 스트림 및 통화 시작 로직 ---
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // 통화를 '받는' 사람인지, '거는' 사람인지에 따라 로직 분기
        if (initialOffer) { // 받는 사람 (Callee)
          pc.setRemoteDescription(new RTCSessionDescription(initialOffer))
            .then(() => pc.createAnswer())
            .then(answer => {
              pc.setLocalDescription(answer);
              sendSignal('answer', answer, myProfile, partnerProfile);
            });
        } else { // 거는 사람 (Caller)
          pc.createOffer()
            .then(offer => {
              pc.setLocalDescription(offer);
              sendSignal('offer', offer, myProfile, partnerProfile);
            });
        }
      })
      .catch(error => 
        alert("미디어 장치를 확인할 수 없습니다. 카메라를 확인 한 후 다시 통화를 시도해주세요.")
      );

    // 3. 컴포넌트가 사라질 때 ChatManager에서 핸들러를 '등록 해제'합니다.
    return () => {
        unregisterSignalHandler(partnerProfile.userNo);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
    };
  }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

  const handleHangUpClick = () => {
    // 1. 상대방에게 'hang-up' 시그널을 보냅니다.
    sendSignal('hang-up', null, myProfile, partnerProfile);
    
    // 2. 자신의 창을 닫기 위해 부모의 onHangUp 함수를 호출합니다.
    onHangUp();
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* 상대방 영상 */}
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      
      {/* 내 영상 (작게) */}
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-1/3 max-w-[150px] border-2 border-white rounded-md" />

      {/* 통화 종료 버튼 */}
      <button 
        onClick={handleHangUpClick}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-4 hover:bg-red-600"
      >
        <XIcon size={36}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 4.5 15.001m0 0L3.75 12M4.5 15.001l2.25 2.25M3.75 3.75 15 15.001" />
        </XIcon>
      </button>
    </div>
  );
};