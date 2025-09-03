import { useState } from 'react';
import FloatingWindow from './FloatingWindow';
import ChatMenu from './ChatMenu';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';

interface WindowState {
  id: string;
  title: string;
  zIndex: number;
  position: { top: number, left: number };
}

interface ChatManagerProps {
  onClose: () => void;
}

const ChatManager = ({ onClose }: ChatManagerProps) => {
  const initialWidth = 320;
  const initialHeight = 400;
  const initialTop = (window.innerHeight - initialHeight) / 2;
  const initialLeft = (window.innerWidth - initialWidth) / 2;

  const [windows, setWindows] = useState<WindowState[]>([{
    id: "chat-menu",
    title: "채팅",
    zIndex: 10,
    position: { top: initialTop, left: initialLeft }
  }]);
  const [nextZIndex, setNextZIndex] = useState(11);

  const handleOpenChat = (id: string, title: string) => {
    const existingWindow = windows.find(win => win.id === id);
    if (existingWindow) {
      handleFocusWindow(id);
      return;
    }
    const newWindow: WindowState = { id, title, zIndex: nextZIndex, position: { top: initialTop, left: initialLeft } };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };
  
  const handleCloseWindow = (id: string) => {
    const updatedWindows = windows.filter(win => win.id !== id);
    setWindows(updatedWindows);
    if (updatedWindows.length === 0) { 
        onClose();
    }
  };
  
  const handleFocusWindow = (id: string) => {
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

  const handleDragStart = (event: DragStartEvent) => {
    handleFocusWindow(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;

    setWindows(currentWindows => 
      currentWindows.map(win => 
        win.id === id 
          ? { ...win, position: { 
              top: win.position.top + delta.y, 
              left: win.position.left + delta.x 
            } } 
          : win
      )
    );
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {windows.map(window => (
          <FloatingWindow
            key={window.id}
            id={window.id}
            title={window.title}
            onClose={handleCloseWindow}
            onFocus={handleFocusWindow}
            zIndex={window.zIndex}
            position={window.position}
          >
            {window.id === 'chat-menu' ? (
              <ChatMenu onUserClick={handleUserClick} />
            ) : (
              <p>채팅창 내용</p>
            )}
          </FloatingWindow>
        ))}
      </DndContext>
    </div>
  );
};

export default ChatManager;