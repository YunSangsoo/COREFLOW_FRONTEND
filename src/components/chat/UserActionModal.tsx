import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { chatProfile } from '../../types/chat';

interface UserActionModalProps {
  user: chatProfile;
  position: { top: number; left: number };
  onClose: () => void;
  onStartChat: (user: chatProfile) => void;
  onViewProfile: (user: chatProfile) => void;
}

const UserActionModal = ({ user, position, onClose, onStartChat, onViewProfile }: UserActionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-40"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 text-sm text-gray-700">
        <li>
          <button
            onClick={() => { onStartChat(user); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            1:1 채팅
          </button>
        </li>
        <li>
          <button
            onClick={() => { onViewProfile(user); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            프로필 조회
          </button>
        </li>
      </ul>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UserActionModal;