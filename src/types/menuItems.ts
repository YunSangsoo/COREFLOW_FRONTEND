export interface MenuItem {
  name: string;
  path?: string; // 페이지 이동 경로 (선택 사항)
  action?: 'toggleSubMenu' | 'chat' | 'notice'; // 특별한 동작을 위한 구분자 (선택 사항)
  subItems?: Omit<MenuItem, 'subItems'>[]; // 하위 메뉴
}

export const menuItems: MenuItem[] = [
  {
    name: '인사관리',
    action: 'toggleSubMenu', // 이 항목은 하위 메뉴를 열고 닫는 역할
    subItems: [
      { name: '사원관리', path: '/members' },
      { name: '휴가관리', path: '/vacation/personal' },
      { name: '근태관리', path: '/attendance/personal' },
      { name: '조직도', path: '/organization' },
    ],
  },
  { name: '전자결제', path: '/approval' }, // 실제 경로로 수정 필요
  { name: '캘린더', path: '/calendar' },
  { name: '회의실', path: '/rooms' },
  { name: '회사 규정', path: '/cpolicies' },
  { name: '공지', action: 'notice' },
  { name: '채팅', action: 'chat' }, // 이 항목은 채팅창을 여는 역할
];