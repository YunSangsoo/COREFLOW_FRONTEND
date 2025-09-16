import { useEffect, useRef, useState } from "react";
import type { chatProfile, chatProfileDetail } from "../../types/chat";
import { api } from "../../api/coreflowApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

interface ProfileWindowProps {
  user: chatProfile;
  onStartChat: (user: chatProfile) => void;
  onSetMyProfile: (user: chatProfile) => void;
}

export const ProfileWindow = ({ user, onStartChat, onSetMyProfile }: ProfileWindowProps) => {
  const auth = useSelector((state: RootState) => state.auth);
  const [updatedUser, setUsers] = useState<chatProfileDetail>({...user,email:'',phone:'',posName:'',depName:''});
    // 선택된 파일을 저장할 state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 업로드 진행 상태를 표시할 state
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 숨겨진 <input type="file">을 제어하기 위한 ref

  // 파일 선택 창을 여는 함수
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    // 컴포넌트가 언마운트될 때 생성된 임시 URL을 해제합니다.
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // 기존 미리보기 URL이 있다면 메모리에서 해제
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      // 선택된 이미지 파일로 미리보기 URL 생성
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };
  
  useEffect(()=>{
    api.get(`/chatting/profile/${user.userNo}`).then(res =>(setUsers(res.data)));
  },[])

  // 파일 업로드를 실행하는 함수
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('업로드할 파일을 먼저 선택해주세요.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    setIsUploading(true);
    try {
      const response = await api.post('/chatting/profile/image', formData);
      console.log('업로드 성공:', response.data);
      alert('프로필 이미지가 변경되었습니다.');
      // TODO: 업로드 성공 후 updatedUser 또는 user 상태를 업데이트하여 화면에 즉시 반영
      const newProfileDetail = response.data;
      const { email, phone, depName, posName, ...baseProfile } = newProfileDetail;
      onSetMyProfile(baseProfile);
      setUsers(newProfileDetail);

      setSelectedFile(null);
      setPreviewUrl(`${import.meta.env.VITE_API_BASE_URL}/images/${baseProfile.profile.imageCode}/${baseProfile.profile.changeName}`);
      

    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const originalImageUrl = `${import.meta.env.VITE_API_BASE_URL}/images/${user.profile.imageCode}/${user.profile.changeName}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <div className="w-full max-w-sm mx-auto text-center space-y-6">
        
        <img 
          src={previewUrl || originalImageUrl}
          className="w-1/2 aspect-square bg-gray-200 rounded-lg mx-auto object-cover"
        />
        <h2 className="text-2xl font-bold text-gray-800">{updatedUser.userName}</h2>

        
        {(auth.isAuthenticated && auth.user?.userNo === user.userNo) && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
            {!selectedFile && (
              <button onClick={handleSelectFileClick} className="px-4 py-2 bg-emerald-400 hover:bg-emerald-600 text-white rounded-md">
                이미지 변경
              </button>
            )}
            {selectedFile && (
              <button onClick={handleUpload} disabled={isUploading} className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-400">
                {isUploading ? '업로드 중...' : '이 이미지로 업로드'}
              </button>
            )}
          </>
        )}


        <div className="text-left grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-gray-500">부서</dt>
            <dd className="text-gray-800">{updatedUser.depName}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="font-semibold text-gray-500">직급</dt>
            <dd className="text-gray-800">{updatedUser.posName}</dd>
          </div>


          <div className="flex justify-between">
            <dt className="font-semibold text-gray-500">이메일</dt>
            <dd className="text-gray-800 underline cursor-pointer">{updatedUser.email}</dd>
          </div>


          <div className="flex justify-between">
            <dt className="font-semibold text-gray-500">연락처</dt>
            <dd className="text-gray-800">{updatedUser.phone}</dd>
          </div>
        </div>

        {/* 채팅하기 버튼 */}
        { (auth.isAuthenticated && auth.user?.userNo!==user.userNo) ? 
        <button
          onClick={() => onStartChat(user)}
          className="w-full px-6 py-2 mt-4 text-base font-semibold text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        >
          채팅하기
        </button> : <></>
        }
      </div>
    </div>
  );
};