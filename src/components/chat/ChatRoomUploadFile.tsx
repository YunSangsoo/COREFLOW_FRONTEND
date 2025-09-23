import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../api/coreflowApi';
import type { ChatMessage, chatProfile, ChatRooms } from '../../types/chat';
import stompClient from '../../api/webSocketApi';
import { useDropzone } from 'react-dropzone';

interface ChatRoomUploadFileProps {
  chatRoom: ChatRooms;
  myProfile: chatProfile;
  onUploadComplete: () => void;
  directFiles? : File[];
}

export const ChatRoomUploadFile = ({ chatRoom,myProfile, onUploadComplete,directFiles }: ChatRoomUploadFileProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(directFiles ?? null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    directFiles ?(directFiles.filter(file => file.type.startsWith('image/')).map(imageFile => URL.createObjectURL(imageFile))):([]));
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 기존 미리보기 URL들을 모두 해제
    previewUrls.forEach(url => URL.revokeObjectURL(url));

    setSelectedFiles(acceptedFiles);

    const imagePreviewUrls = acceptedFiles
      .filter(file => file.type.startsWith('image/'))
      .map(imageFile => URL.createObjectURL(imageFile));
    
    setPreviewUrls(imagePreviewUrls);
  }, [previewUrls]); // previewUrls가 변경될 때마다 함수를 새로 만듭니다.

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // (선택사항) 특정 파일 타입만 허용할 수 있습니다.
    // accept: { 'image/*': ['.jpeg', '.png', '.gif'] }
  });

  useEffect(() => {
    // 컴포넌트가 사라질 때 메모리 누수 방지를 위해 임시 URL 해제
    return () => {
      if (previewUrls) {
        previewUrls.forEach(url => URL.revokeObjectURL(url));
      }
    };
  }, [previewUrls]);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: FileList | null = event.target.files;
    previewUrls.forEach(url => URL.revokeObjectURL(url)); // 기존 미리보기 해제

    if(fileList){
      const fileArray: File[] = Array.from(fileList);
      const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
      const fileNames = fileArray.map(file => file.name);
    
      setSelectedFiles(fileArray);

      
      const imagePreviewUrls = fileArray
      .filter(file => file.type.startsWith('image/'))
      .map(imageFile => URL.createObjectURL(imageFile));
    
      setPreviewUrls(imagePreviewUrls);
    }
  };

  const handlePasteClipboard= (event: React.ClipboardEvent<HTMLDivElement>) => {
    const fileList: FileList | null = event.clipboardData.files;
    previewUrls.forEach(url => URL.revokeObjectURL(url)); // 기존 미리보기 해제

    if(fileList){
      const fileArray: File[] = Array.from(fileList);
      const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
      const fileNames = fileArray.map(file => file.name);
    
      setSelectedFiles(fileArray);

      
      const imagePreviewUrls = fileArray
      .filter(file => file.type.startsWith('image/'))
      .map(imageFile => URL.createObjectURL(imageFile));
    
      setPreviewUrls(imagePreviewUrls);
    }
  }
  
  const handleUploadComplete = (message:ChatMessage) => {

    if (stompClient?.connected) {
      stompClient?.publish({
        destination: `/app/chat/file/${chatRoom.roomId}`, // 메시지 전송용 엔드포인트
        body: JSON.stringify({
          messageId:message.messageId,
          roomId:chatRoom.roomId,
          userName : myProfile.userName,
          messageText: message.messageText,
          sentAt: new Date(),
          type: 'FILE',
          isFile: message.file?.changeName,
        }),
      });
      onUploadComplete();
    }
  }

  const handleUpload = async () => {

    setIsUploading(true);
    if (selectedFiles===null||selectedFiles.length === 0) return;

    const formData = new FormData();
    // 반복문을 사용해 모든 파일을 동일한 키('files')로 FormData에 추가
    selectedFiles.forEach(file => {
      formData.append('files', file); // 백엔드에서는 List<MultipartFile>로 받게 됩니다.
    });
    setIsUploading(true);

    try {
      const response = await api.post<ChatMessage[]>(`/chatting/room/${chatRoom.roomId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('파일 전송에 성공했습니다.');

      response.data.forEach(message => {
        if (stompClient?.connected) {
          stompClient?.publish({
            destination: `/app/chat/file/${chatRoom.roomId}`,
            body: JSON.stringify({
              messageId:message.messageId,
              roomId:chatRoom.roomId,
              userName : myProfile.userName,
              messageText: message.messageText,
              sentAt: new Date(),
              type: 'FILE',
              isFile: message.file?.changeName,
            }),
          });
        }
      });

      onUploadComplete();
    } catch (error) {
      alert('파일 전송에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-gray-50"
        onPaste={handlePasteClipboard}
        tabIndex={0}
    >
      <div 
        {...getRootProps()}
        // ✅ 4. isDragActive로 드래그 상태에 따라 스타일을 동적으로 변경합니다.
        className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 
                   ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        {/* ✅ 5. getInputProps를 input에 적용합니다. */}
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <p className="text-sm text-blue-600 font-semibold">여기에 파일을 놓으세요!</p>
        ) : (selectedFiles && selectedFiles.length > 0) ? (
          <div className="text-sm font-semibold text-gray-700 text-left">
            <p>{selectedFiles.length}개의 파일 선택됨:</p>
            <ul className="list-disc list-inside font-normal">
              {selectedFiles.map(file => <li key={file.name} className="truncate">{file.name}</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">파일을 드래그하거나 여기를 클릭하세요</p>
        )}
      </div>

      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md justify-center">
          {previewUrls.map(url => (
            <img key={url} src={url} alt="미리보기" className="w-20 h-20 object-cover rounded" />
          ))}
        </div>
      )}

      <div className="flex-grow flex items-end">
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
          className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isUploading ? '전송 중...' : (( selectedFiles? `${selectedFiles?.length}`:`0` )+"개 파일 전송하기")}
        </button>
      </div>
    </div>
  );
};