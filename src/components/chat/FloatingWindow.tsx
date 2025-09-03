import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import type { ResizableBoxProps } from 'react-resizable';
import 'react-resizable/css/styles.css'; // 리사이즈 핸들러를 위한 기본 스타일

interface FloatingWindowProps {
    id: string;
    title: string;
    onClose: (id: string) => void;
    onFocus: (id: string) => void;
    zIndex: number;
    children: React.ReactNode;
}

const FloatingWindow = ({ id, title, onClose, onFocus, zIndex, children }: FloatingWindowProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const [size, setSize] = useState({ width: 320, height: 400 });

    // dnd-kit의 transform 속성만 사용하도록 스타일을 수정
    const style = {
        // z-index로 겹침 순서 제어
        zIndex: zIndex,
        // 절대 위치 및 초기 중앙 정렬
        position: 'absolute',
        top: '50%',
        left: '50%',
        // 드래그로 인한 transform 값
        // 창의 크기만큼 다시 옮겨서 중앙 정렬
        transform: `${CSS.Translate.toString(transform)}`,
    }as React.CSSProperties;

    // 리사이즈 이벤트 핸들러
    const handleResize: ResizableBoxProps['onResize'] = (e, { size }) => {
        setSize(size);
    };

return (
        <div 
            ref={setNodeRef}
            style={style as React.CSSProperties}
            onMouseDown={() => onFocus(id)}
        >
            <ResizableBox
                width={size.width}
                height={size.height}
                minConstraints={[200, 200]} // 최소 너비, 최소 높이
                maxConstraints={[800, 800]} // 최대 너비, 최대 높이
                onResize={handleResize}
                className="rounded-lg flex flex-col overflow-hidden shadow-lg"
            >
                <div 
                    className="handle flex justify-between items-center p-3 bg-gray-100 border-b cursor-grab"
                    {...listeners}
                    {...attributes}
                >
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <button onClick={() => onClose(id)}>
                        &times;
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-white">
                    {children}
                </div>
            </ResizableBox>
        </div>
    );
};

export default FloatingWindow;
