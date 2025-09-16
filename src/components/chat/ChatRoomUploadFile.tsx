import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../api/coreflowApi';
import type { chatProfile, ChatRooms } from '../../types/chat';
import stompClient from '../../api/webSocketApi';

interface ChatRoomUploadFileProps {
  chatRoom: ChatRooms;
  myProfile: chatProfile;
  onUploadComplete: () => void;
}

export const ChatRoomUploadFile = ({ chatRoom,myProfile, onUploadComplete }: ChatRoomUploadFileProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 컴포넌트가 사라질 때 메모리 누수 방지를 위해 임시 URL 해제
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl); // 기존 미리보기 해제

    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file)); // 이미지 파일이면 미리보기 생성
      } else {
        setPreviewUrl(null); // 이미지가 아니면 미리보기 없음
      }
    }
  };

  const handleUploadComplete = () => {

    if (stompClient?.connected) {
      stompClient?.publish({
        destination: `/app/chat/file/${chatRoom.roomId}`, // 메시지 전송용 엔드포인트
        body: JSON.stringify({
          roomId:chatRoom.roomId,
          userName : myProfile.userName,
          messageText: '',
          sentAt: new Date(),
          type: 'FILE',
        }),
      });
      onUploadComplete();
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsUploading(true);

    try {
      await api.post(`/chatting/room/${chatRoom.roomId}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('파일 전송에 성공했습니다.');
      handleUploadComplete();
    } catch (error) {
      alert('파일 전송에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-gray-50">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full h-32 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {selectedFile ? (
          <p className="text-sm font-semibold text-gray-700">{selectedFile.name}</p>
        ) : (
          <p className="text-sm text-gray-500">여기를 클릭하여 파일을 선택하세요</p>
        )}
      </div>

      {previewUrl && (
        <div className="flex justify-center border rounded-md p-2">
          <img src={previewUrl} alt="미리보기" className="max-h-40 object-contain" />
        </div>
      )}

      <div className="flex-grow flex items-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isUploading ? '전송 중...' : '전송하기'}
        </button>
      </div>
    </div>
  );
};