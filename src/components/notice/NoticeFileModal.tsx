import type { customFile } from "../../types/type";

interface NoticeFileModalProps{
    files:customFile[];
    onClose:() => void;
}

export default function NoticeFileModal({files, onClose}:NoticeFileModalProps){
    return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>첨부파일 목록</h3>
          <button onClick={onClose} className="close-button">X</button>
        </div>
        <div className="modal-body">
          {files.length > 0 ? (
            <ul>
              {files.map((file) => (
                <li key={file.imageCode}>
                    <a download={file.originName} className="file-link"
                        href={`${import.meta.env.VITE_API_BASE_URL}/download/${file.imageCode}/${file.changeName}`}>
                        {file.originName}
                    </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>첨부된 파일이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};