import type { customFile } from "../../types/type";

interface NoticeFileModalProps{
    files:customFile[];
    onClose:() => void;
}

export default function NoticeFileModal({files, onClose}:NoticeFileModalProps){
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="w-11/12 max-w-lg overflow-hidden rounded-lg bg-white shadow-xl md:w-full">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xl font-bold">첨부파일 목록</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {files.length > 0 ? (
            <ul>
              {files.map((file) => (
                <li key={file.imageCode} className="my-2 border-b last:border-b-0">
                    <a download={file.originName} className="file-link block p-2 text-blue-600 hover:text-blue-800"
                        href={`${import.meta.env.VITE_API_BASE_URL}/download/${file.imageCode}/${file.changeName}`}>
                        {file.originName}
                    </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">첨부된 파일이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};