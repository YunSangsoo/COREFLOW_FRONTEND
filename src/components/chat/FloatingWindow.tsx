import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import type { ResizableBoxProps } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface FloatingWindowProps {
    id: string;
    title: string;
    onClose: (id: string) => void;
    onFocus: (id: string) => void;
    zIndex: number;
    position: { top: number, left: number };
    children: React.ReactNode;
}

const FloatingWindow = ({ id, title, onClose, onFocus, zIndex, position, children }: FloatingWindowProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const [size, setSize] = useState({ width: 320, height: 400 });

    const style = {
        zIndex: zIndex,
        position: 'absolute' as const,
        top: position.top,
        left: position.left,
        width: size.width,  // width와 height를 스타일에 직접 적용
        height: size.height, // ResizableBox가 아닌 외부 div에 크기를 제어
    };
    
    const dragStyle = transform ? {
        ...style,
        transform: `translate(${transform.x}px, ${transform.y}px)`,
    } : { ...style, transform: 'translate(0,0)' };

    const handleResize: ResizableBoxProps['onResize'] = (e, { size }) => {
        setSize(size);
    };

    return (
        <div 
            ref={setNodeRef}
            style={dragStyle}
            onMouseDown={() => onFocus(id)}
            className="pointer-events-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] rounded-lg"
        >
            <ResizableBox
                width={size.width}
                height={size.height}
                minConstraints={[200, 200]}
                maxConstraints={[800, 800]}
                onResizeStart={(e) => { e.stopPropagation(); onFocus(id); }}
                onResize={handleResize}
                resizeHandles={['s', 'e', 'se']}
                className="rounded-lg flex flex-col overflow-hidden bg-white"
                // ResizableBox는 크기만 조절하고 내부는 100% 채우도록 함
                style={{width: '100%', height: '100%'}} 
            >
                <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
                    <div 
                        className="handle flex-grow cursor-grab"
                        {...attributes}
                        {...listeners}
                    >
                        <h2 className="text-sm font-semibold">{title}</h2>
                    </div>
                    <button 
                        onClick={() => onClose(id)}
                        className="p-1 ml-2"
                    >
                        &times;
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {children}
                </div>
            </ResizableBox>
        </div>
    );
};

export default FloatingWindow;