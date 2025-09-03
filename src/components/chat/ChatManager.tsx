import { useState } from 'react';
import FloatingWindow from './FloatingWindow';
import ChatMenu from './ChatMenu';
import { DndContext } from '@dnd-kit/core';
//import ChatWindow from './ChatWindow'; // 새로 추가할 채팅창 컴포넌트

interface WindowState {
  id: string;
  title: string;
  zIndex: number;
}

interface ChatManagerProps {
  onClose: () => void;
}

const ChatManager = ({ onClose }: ChatManagerProps) => {
  const [windows, setWindows] = useState<WindowState[]>([{
    id: "chat-menu",
    title: "채팅",
    zIndex: 10
  }]);
  const [nextZIndex, setNextZIndex] = useState(11);
  
  const handleOpenChat = (id: string, title: string) => {
    console.log(`열기 버튼이 눌린 창 ID: ${id}`);
    console.log("현재 windows 배열:", windows.map(win => win.id));
    const existingWindow = windows.find(win => win.id === id);
    if (existingWindow) {
      handleFocusWindow(id);
      return;
    }
    
    const newWindow: WindowState = { id, title, zIndex: nextZIndex };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };
  
  const handleCloseWindow = (id: string) => {
    console.log(`닫기 버튼이 눌린 창 ID: ${id}`);
    console.log("현재 windows 배열:", windows.map(win => win.id));
    const updatedWindows = windows.filter(win => win.id !== id);
    setWindows(updatedWindows);
    console.log("업데이트된 windows 배열:", updatedWindows.map(win => win.id));
    console.log("업데이트된 배열 길이:", updatedWindows.length);

    if (updatedWindows.length === 0) { 
        console.log("모든 창이 닫혔습니다. ChatManager가 unmount됩니다.");
        onClose();
    }
  };
  
  const handleFocusWindow = (id: string) => {
    console.log(`포커스 중인 창 ID: ${id}`);
    setWindows(prevWindows => 
      prevWindows.map(win => ({
        ...win,
        zIndex: win.id === id ? nextZIndex : win.zIndex,
      }))
    );
    setNextZIndex(nextZIndex + 1);
  };
  
  const handleUserClick = (userId: string, userName: string) => {
    handleOpenChat(`chat-${userId}`, `${userName} 님과의 채팅`);
  };

  return (
    <div className="fixed inset-0 z-40">
      <DndContext>
        {/* windows 배열을 map으로 순회하며 모든 FloatingWindow를 렌더링합니다. */}
        {windows.map(window => (
          <FloatingWindow
            key={window.id}
            id={window.id}
            title={window.title}
            // ✅ onClose prop에 handleCloseWindow를 연결하고, 현재 창의 ID를 전달합니다.
            onClose={() => handleCloseWindow(window.id)}
            onFocus={() => handleFocusWindow(window.id)}
            zIndex={window.zIndex}
          >
            {/* id에 따라 다른 컴포넌트 렌더링 */}
            {window.id === 'chat-menu' ? (
              <ChatMenu onUserClick={handleUserClick} />
            ) : (
              // <ChatWindow windowId={window.id} />
              <></>
            )}
          </FloatingWindow>
        ))}
      </DndContext>
    </div>
  );
};

export default ChatManager;